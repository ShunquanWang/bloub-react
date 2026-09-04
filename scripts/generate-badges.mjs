import cheerio from 'cheerio';
import fs from 'fs';
import https from 'https';

const coverageFile = './coverage/index.html';
const badgesDir = './coverage/badges';

// Read the coverage HTML file.
fs.readFile(coverageFile, 'utf-8', (err, data) => {
  if (err) {
    console.error(`Error reading coverage file: ${err}`);
    process.exit(1);
  }

  // Parse the HTML using Cheerio.
  const $ = cheerio.load(data);

  // Construct the shields.io URL for each badge.
  const statementsBadgeUrl = generateUrl('statements', extractPercentage($, 1));
  const branchesBadgeUrl = generateUrl('branches', extractPercentage($, 2));
  const functionsBadgeUrl = generateUrl('functions', extractPercentage($, 3));
  const linesBadgeUrl = generateUrl('lines', extractPercentage($, 4));

  // Create the badges directory if it does not exist.
  if (!fs.existsSync(badgesDir)) {
    fs.mkdirSync(badgesDir);
  }

  // Download each badge and save it to the badges directory.
  downloadBadge(statementsBadgeUrl, `${badgesDir}/statements.svg`);
  downloadBadge(branchesBadgeUrl, `${badgesDir}/branches.svg`);
  downloadBadge(functionsBadgeUrl, `${badgesDir}/functions.svg`);
  downloadBadge(linesBadgeUrl, `${badgesDir}/lines.svg`);

  console.log('Code coverage badges created successfully.');
});

/**
 * Generate a shields.io URL for a badge.
 *
 * Change the color of the badge based on the percentage.
 *
 * @param {string} text The text to display on the badge.
 * @param {number} percentage The percentage to display on the badge.
 * @returns {string} The shields.io URL.
 */
const generateUrl = (text, percentage) => {
  let color = 'brightgreen';
  if (percentage < 70) {
    color = 'red';
  } else if (percentage < 80) {
    color = 'yellow';
  } else if (percentage < 90) {
    color = 'orange';
  }
  return `https://img.shields.io/badge/coverage%3A${text}-${percentage}%25-${color}.svg`;
};

/**
 * Extract the code coverage percentage from the HTML.
 * @param {Cheerio} $ The Cheerio object.
 * @param {number} index The index of the element to extract.
 */
const extractPercentage = ($, index) => {
  const text = $(`.pad1y:nth-child(${index}) span.strong`) ?? '0';
  const percentage = text.text().trim().replace('%', '');
  return parseFloat(percentage);
};

/**
 * Download a badge from shields.io.
 * @param {string} url The shields.io URL.
 * @param {string} filename The filename to save the badge to.
 */
const downloadBadge = (url, filename) => {
  https.get(url, (res) => {
    if (res.statusCode !== 200) {
      console.error(`Error downloading badge: ${res.statusMessage}`);
      return;
    }

    const file = fs.createWriteStream(filename);
    res.pipe(file);
    file.on('finish', () => {
      file.close();
    });
  });
};
