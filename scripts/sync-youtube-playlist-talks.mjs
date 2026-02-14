#!/usr/bin/env node
/**
 * Syncs talks from a YouTube playlist to content/talks.
 * Fetches playlist via:
 *   - yt-dlp (repo-installed via yt-dlp-wrap on first run, or system yt-dlp), or
 *   - YouTube Data API v3 (if YOUTUBE_API_KEY is set; get one at https://console.cloud.google.com/apis/credentials).
 * Leaves existing talks unchanged (matched by video ID in content).
 * Creates new talk .md files with brief description, tags, and YouTube link.
 *
 * Usage: node scripts/sync-youtube-playlist-talks.mjs [playlist_url]
 *        node scripts/sync-youtube-playlist-talks.mjs --backfill-only
 * Default playlist: https://www.youtube.com/watch?v=wM-dTroS0FA&list=PLsvkGFT5--nibZKprha_VWvZ6mHFzgToM
 * Use --backfill-only to add conference/conferenceUrl to existing talk files that have a YouTube link but lack them.
 * Use --remove-duplicates to delete duplicate talk files (same talk, different titles); keeps the original and merges YouTube links.
 */

import { createRequire } from "module";
import { readdirSync, readFileSync, existsSync, writeFileSync, mkdirSync, unlinkSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const require = createRequire(import.meta.url);
const YTDlpWrap = require("yt-dlp-wrap").default;

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const TALKS_DIR = join(ROOT, "content", "talks");

const DEFAULT_PLAYLIST =
  "https://www.youtube.com/watch?v=wM-dTroS0FA&list=PLsvkGFT5--nibZKprha_VWvZ6mHFzgToM";

const TAG_KEYWORDS = [
  "serverless",
  "observability",
  "EDA",
  "event-driven",
  "AWS",
  "architecture",
  "DORA",
  "DevOps",
  "team topologies",
  "conference",
  "meetup",
];

function slugify(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Strip leading "Speaker, Speaker - " or "Speaker & Speaker - " so the title is the talk title only. */
function stripSpeakerPrefix(title) {
  if (!title || typeof title !== "string") return title;
  const t = title.trim();
  const comma = /^\s*\w+(?:\s+\w+){0,3}\s*,\s*\w+(?:\s+\w+){0,3}\s*-\s*/;
  const ampersand = /^\s*\w+(?:\s+\w+){0,3}\s*&\s*\w+(?:\s+\w+){0,3}\s*-\s*/;
  return t.replace(comma, "").replace(ampersand, "").trim() || t;
}

function firstParagraphOrSlice(text, maxChars = 400) {
  if (!text || typeof text !== "string") return "";
  const trimmed = text.trim();
  const firstLine = trimmed.split(/\n+/)[0];
  if (firstLine.length <= maxChars) return firstLine;
  return firstLine.slice(0, maxChars).replace(/\s+\S*$/, "") + "…";
}

function inferTags(title, description) {
  const combined = `${title} ${description || ""}`.toLowerCase();
  const tags = ["talk"];
  if (combined.includes("podcast")) tags.push("podcast");
  if (combined.includes("interview")) tags.push("interview");
  for (const kw of TAG_KEYWORDS) {
    if (combined.includes(kw.toLowerCase())) {
      const tag = kw === "team topologies" ? "team-topologies" : kw;
      if (!tags.includes(tag)) tags.push(tag);
    }
  }
  return tags;
}

function formatDate(uploadDate) {
  if (!uploadDate) return null;
  const s = String(uploadDate);
  if (s.length === 8) {
    return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
  }
  if (s.match(/^\d{4}-\d{2}-\d{2}/)) return s.slice(0, 10);
  return null;
}

function escapeTomlString(s) {
  if (s == null) return '""';
  const str = String(s);
  if (str.includes('"') || str.includes("\n")) {
    return `"""${str.replace(/"""/g, '\\"""')}"""`;
  }
  return `"${str.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

const BIN_DIR = join(ROOT, "bin");
const YT_DLP_BINARY = join(BIN_DIR, process.platform === "win32" ? "yt-dlp.exe" : "yt-dlp");

async function ensureYtDlpBinary() {
  if (existsSync(YT_DLP_BINARY)) return YT_DLP_BINARY;
  console.log("Downloading yt-dlp binary (first run)…");
  mkdirSync(BIN_DIR, { recursive: true });
  await YTDlpWrap.downloadFromGithub(YT_DLP_BINARY);
  return YT_DLP_BINARY;
}

async function fetchPlaylistWithYtDlp(playlistUrl) {
  const binaryPath = await ensureYtDlpBinary();
  const ytDlpWrap = new YTDlpWrap(binaryPath);
  const stdout = await ytDlpWrap.execPromise([playlistUrl, "-j", "--no-download"]);
  const lines = (stdout || "")
    .trim()
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const entries = lines
    .map((l) => {
      try {
        return JSON.parse(l);
      } catch {
        return null;
      }
    })
    .filter(Boolean);
  return entries;
}

function extractPlaylistId(url) {
  const m = url.match(/[?&]list=([^&]+)/);
  return m ? m[1] : null;
}

async function fetchPlaylistWithYouTubeApi(playlistUrl) {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) return null;
  const playlistId = extractPlaylistId(playlistUrl);
  if (!playlistId) return null;

  const entries = [];
  let nextPageToken = null;
  do {
    const q = new URLSearchParams({
      part: "snippet",
      maxResults: "50",
      playlistId,
      key: apiKey,
      ...(nextPageToken && { pageToken: nextPageToken }),
    });
    const res = await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?${q}`);
    if (!res.ok) throw new Error(`YouTube API: ${res.status} ${await res.text()}`);
    const data = await res.json();
    for (const item of data.items || []) {
      const vid = item.snippet?.resourceId?.videoId;
      if (!vid) continue;
      const published = item.snippet?.publishedAt?.slice(0, 10);
      entries.push({
        id: vid,
        title: item.snippet?.title || "Untitled",
        description: item.snippet?.description || "",
        upload_date: published?.replace(/-/g, "") || null,
      });
    }
    nextPageToken = data.nextPageToken || null;
  } while (nextPageToken);

  return entries;
}

const MIN_SLUG_LENGTH_FOR_DEDUPE = 15;

function getExistingVideoIds() {
  const ids = new Set();
  if (!existsSync(TALKS_DIR)) return ids;
  for (const name of readdirSync(TALKS_DIR)) {
    if (!name.endsWith(".md")) continue;
    const path = join(TALKS_DIR, name);
    const content = readFileSync(path, "utf8");
    const matches = content.matchAll(/(?:youtu\.be\/|watch\?v=)([a-zA-Z0-9_-]{11})/g);
    for (const m of matches) ids.add(m[1]);
  }
  return ids;
}

function getExistingTalksWithTitles() {
  const talks = [];
  if (!existsSync(TALKS_DIR)) return talks;
  for (const name of readdirSync(TALKS_DIR)) {
    if (!name.endsWith(".md")) continue;
    const filepath = join(TALKS_DIR, name);
    const content = readFileSync(filepath, "utf8");
    const titleMatch = content.match(/title\s*=\s*["']([^"']+)["']/m) || content.match(/title\s*=\s*"""([^"]*)"""/m);
    const title = titleMatch ? titleMatch[1].trim() : "";
    const fmMatch = content.match(/^\+\+\+\n([\s\S]*?)\n\+\+\+\n/);
    const hasConferenceYouTube = fmMatch && /conference\s*=\s*["']YouTube["']/i.test(fmMatch[1]);
    talks.push({ filepath, name, title, titleSlug: slugify(title), content, hasConferenceYouTube });
  }
  return talks;
}

function isSameTalkByTitle(newTitleSlug, existingTalks) {
  if (newTitleSlug.length < MIN_SLUG_LENGTH_FOR_DEDUPE) return null;
  for (const t of existingTalks) {
    const s = t.titleSlug;
    if (s.length < MIN_SLUG_LENGTH_FOR_DEDUPE) continue;
    if (s.includes(newTitleSlug) || newTitleSlug.includes(s)) return t;
  }
  return null;
}

function ensureYouTubeLinkInFile(filepath, videoId) {
  const content = readFileSync(filepath, "utf8");
  const url = `https://youtu.be/${videoId}`;
  if (content.includes(videoId)) return false;
  const linkLine = `- [Watch on YouTube](${url})`;
  if (content.includes("## Links")) {
    const newContent = content.replace(/(## Links\s*\n)/, `$1\n${linkLine}\n`);
    if (newContent !== content) {
      writeFileSync(filepath, newContent);
      return true;
    }
  } else {
    const newContent = content.trimEnd() + `\n\n## Links\n\n${linkLine}\n`;
    writeFileSync(filepath, newContent);
    return true;
  }
  return false;
}

function writeTalkFile(video) {
  const id = video.id;
  const title = stripSpeakerPrefix(video.title || "Untitled talk") || video.title || "Untitled talk";
  const description = video.description || "";
  const uploadDate = video.upload_date || video.created_at;
  const date = formatDate(uploadDate) || new Date().toISOString().slice(0, 10);

  const brief = firstParagraphOrSlice(description);
  const tags = inferTags(title, description);
  const slug = slugify(title);
  let filename = `${slug}.md`;
  let filepath = join(TALKS_DIR, filename);

  if (existsSync(filepath)) {
    const existing = readFileSync(filepath, "utf8");
    if (existing.includes(id)) return { path: filepath, skipped: true };
    filename = `${slug}-${id}.md`;
    filepath = join(TALKS_DIR, filename);
  }

  const youtubelink = `https://youtu.be/${id}`;
  const body = brief
    ? `${brief}\n\n## Links\n\n- [Watch on YouTube](${youtubelink})\n`
    : `## Links\n\n- [Watch on YouTube](${youtubelink})\n`;

  const frontMatter = [
    "+++",
    `title = ${escapeTomlString(title)}`,
    'type = "talk"',
    `date = ${escapeTomlString(date)}`,
    'conference = "YouTube"',
    `conferenceUrl = ${escapeTomlString(youtubelink)}`,
    `tags = [${tags.map((t) => `"${t}"`).join(", ")}]`,
    "+++",
    "",
    body,
  ].join("\n");

  writeFileSync(filepath, frontMatter);
  return { path: filepath, skipped: false };
}

function backfillConferenceInTalkFiles() {
  if (!existsSync(TALKS_DIR)) return;
  const files = readdirSync(TALKS_DIR).filter((n) => n.endsWith(".md"));
  let updated = 0;
  for (const name of files) {
    const filepath = join(TALKS_DIR, name);
    const content = readFileSync(filepath, "utf8");
    const fmMatch = content.match(/^\+\+\+\n([\s\S]*?)\n\+\+\+\n/);
    if (!fmMatch) continue;
    const fm = fmMatch[1];
    if (/conference\s*=/.test(fm) || /conferenceUrl\s*=/.test(fm)) continue;
    const idMatch = content.match(/(?:youtu\.be\/|watch\?v=)([a-zA-Z0-9_-]{11})/);
    if (!idMatch) continue;
    const videoId = idMatch[1];
    const conferenceUrl = `https://youtu.be/${videoId}`;
    const newContent = content.replace(
      /^(\+\+\+\n[\s\S]*?)(\n\+\+\+\n)/,
      (_, frontBlock, closing) =>
        `${frontBlock.trimEnd()}\nconference = "YouTube"\nconferenceUrl = ${escapeTomlString(conferenceUrl)}\n${closing}`
    );
    if (newContent !== content) {
      writeFileSync(filepath, newContent);
      updated++;
      console.log("Backfill:", name);
    }
  }
  if (updated) console.log(`Backfilled conference/conferenceUrl in ${updated} file(s).`);
}

function removeDuplicateTalkFilesSync() {
  if (!existsSync(TALKS_DIR)) return;
  const talks = getExistingTalksWithTitles();
  const removeToKeep = new Map();
  for (let i = 0; i < talks.length; i++) {
    const a = talks[i];
    for (let j = i + 1; j < talks.length; j++) {
      const b = talks[j];
      if (a.titleSlug.length < MIN_SLUG_LENGTH_FOR_DEDUPE || b.titleSlug.length < MIN_SLUG_LENGTH_FOR_DEDUPE) continue;
      const overlap = a.titleSlug.includes(b.titleSlug) || b.titleSlug.includes(a.titleSlug);
      if (!overlap) continue;
      // Only remove script-generated talks (conference=YouTube). Never remove hand-curated entries (different conference/location).
      const remove = a.hasConferenceYouTube && !b.hasConferenceYouTube ? a
        : !a.hasConferenceYouTube && b.hasConferenceYouTube ? b
        : a.hasConferenceYouTube && b.hasConferenceYouTube
          ? (a.titleSlug.length >= b.titleSlug.length ? a : b)
          : null;
      if (!remove) continue;
      const keep = remove === a ? b : a;
      if (removeToKeep.has(remove.filepath) && removeToKeep.get(remove.filepath) !== keep.filepath) continue;
      removeToKeep.set(remove.filepath, keep.filepath);
    }
  }
  const keepPaths = new Set(removeToKeep.values());
  let removedCount = 0;
  for (const [removePath, keepPath] of removeToKeep) {
    if (keepPaths.has(removePath)) continue;
    const removeTalk = talks.find((t) => t.filepath === removePath);
    const videoIdMatch = removeTalk?.content.match(/(?:youtu\.be\/|watch\?v=)([a-zA-Z0-9_-]{11})/);
    if (videoIdMatch) ensureYouTubeLinkInFile(keepPath, videoIdMatch[1]);
    const name = removeTalk?.name ?? removePath;
    const keepName = talks.find((t) => t.filepath === keepPath)?.name ?? keepPath;
    unlinkSync(removePath);
    console.log("Removed duplicate:", name, "-> kept", keepName);
    removedCount++;
  }
  if (removedCount) console.log(`Removed ${removedCount} duplicate file(s).`);
}

async function main() {
  const args = process.argv.slice(2).filter((a) => a && a !== "");
  const backfillOnly = args.includes("--backfill-only");
  const removeDuplicates = args.includes("--remove-duplicates");
  const playlistUrl = args.find((a) => !a.startsWith("-")) || DEFAULT_PLAYLIST;

  if (removeDuplicates) {
    console.log("Removing duplicate talk files (keeping originals, merging YouTube links)…");
    removeDuplicateTalkFilesSync();
    if (backfillOnly) return;
  }

  if (backfillOnly) {
    console.log("Running backfill only (add conference/conferenceUrl where missing).");
    backfillConferenceInTalkFiles();
    return;
  }

  let entries = null;

  if (process.env.YOUTUBE_API_KEY) {
    console.log("Fetching playlist with YouTube Data API…");
    try {
      entries = await fetchPlaylistWithYouTubeApi(playlistUrl);
    } catch (e) {
      console.error("YouTube API error:", e.message);
      process.exit(1);
    }
  }

  if (!entries) {
    console.log("Fetching playlist with yt-dlp:", playlistUrl);
    try {
      entries = await fetchPlaylistWithYtDlp(playlistUrl);
    } catch (e) {
      console.error(
        "Failed to fetch playlist. Run npm install, then run this script again (yt-dlp is downloaded on first run). Or set YOUTUBE_API_KEY (YouTube Data API v3)."
      );
      console.error(e.message);
      process.exit(1);
    }
  }

  const existingIds = getExistingVideoIds();
  const existingTalks = getExistingTalksWithTitles();
  console.log(`Playlist has ${entries.length} video(s). ${existingIds.size} video ID(s) already in content/talks.`);

  for (const video of entries) {
    const id = video.id;
    const title = video.title || "Untitled talk";
    if (existingIds.has(id)) {
      console.log("Skip (already present):", title.slice(0, 50) || id);
      continue;
    }
    const duplicate = isSameTalkByTitle(slugify(title), existingTalks);
    if (duplicate) {
      const added = ensureYouTubeLinkInFile(duplicate.filepath, id);
      console.log("Skip (duplicate of existing):", duplicate.name, added ? "(YouTube link added to original)" : "");
      continue;
    }
    const result = writeTalkFile(video);
    if (result.skipped) continue;
    console.log("Added:", result.path);
  }

  backfillConferenceInTalkFiles();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
