import pa11y from 'pa11y';
import fetch from 'node-fetch';
import { parseStringPromise } from 'xml2js';
import { writeFile } from 'fs/promises';
import { stringify } from 'csv-stringify/sync';

// Function to parse the sitemap and return URLs
async function getUrlsFromSitemap(sitemapUrl) {
    const response = await fetch(sitemapUrl);
    const xml = await response.text();
    const result = await parseStringPromise(xml);
    return result.urlset.url.map(entry => entry.loc[0]);
}

// Custom options for Pa11y and Puppeteer
const options = {
    chromeLaunchConfig: {
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--disable-gpu'
        ]
    }
};

// Function to run Pa11y on each URL and return results
async function runPa11y(url) {
    return await pa11y(url, options);
}

// Function to run Pa11y on each URL and save the results
async function runPa11yOnUrls(urls) {
    const allResults = [];

    for (const url of urls) {
        console.log(`Running Pa11y on ${url}`);
        const result = await runPa11y(url);

        // Extract relevant information for CSV
        result.issues.forEach(issue => {
            allResults.push({
                url: url,
                code: issue.code,
                type: issue.type,
                message: issue.message,
                selector: issue.selector,
                context: issue.context
            });
        });
    }

    // Convert results to CSV format
    const csvData = stringify(allResults, {
        header: true,
        columns: ['url', 'code', 'type', 'message', 'selector', 'context']
    });

    // Write CSV data to a file
    await writeFile('pa11y-results.csv', csvData);
    console.log('Results saved to pa11y-results.csv');
}

// Main function to get URLs from the sitemap and run Pa11y
(async () => {
    const sitemapUrl = 'https://toli.io/sitemap.xml';
    const urls = await getUrlsFromSitemap(sitemapUrl);
    await runPa11yOnUrls(urls);
})();
