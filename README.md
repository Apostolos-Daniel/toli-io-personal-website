# apostolis

Personal web page to write blogs, update projects and hold a CV page

## Development

To start developing the website, first check whether it builds and runs smoothly. From the root folder run:

```bash
hugo server -D
```

This assumes that you have [hugo](https://gohugo.io/getting-started/installing/) installed (extended edition recommended).

## Deploying to Cloudflare Pages

The theme uses Hugo’s `css.Sass` API, which requires **Hugo 0.128.0 or later**. Cloudflare Pages defaults to an older Hugo, so set this in your project:

1. In the [Cloudflare dashboard](https://dash.cloudflare.com/), open your Pages project.
2. Go to **Settings** → **Environment variables**.
3. Add **HUGO_VERSION** with value **`0.128.0`** (or newer, e.g. `0.155.0`).
4. If you use preview deployments, add the same variable for the **Preview** environment.

Then trigger a new build; the “can't evaluate field Sass in type interface {}” error should be resolved.

## Windows (choco)

```bash
choco install hugo -confirm
```

## MacOS (brew)

```bash
brew install hugo
```

## Linux (apt)

```bash
sudo apt install hugo
```

## Git users

To make sure you are using the correct user (applying it to my case - please replace 'apostolos-daniel' with your github user):

```bash
git clone git@github.com-apostolos-daniel:Apostolos-Daniel/toli-io-personal-website.git toli_io_personal_website_apostolos-daniel
git config --local -e
```

Add name and email to your local git config:

```bash
[user]
        name = toli
        email = dev@toli.io
```

Some of this was sourced from <https://gist.github.com/Jonalogy/54091c98946cfe4f8cdab2bea79430f9>.
