const https = require('https');

function getWikiImageUrl(filename) {
  return new Promise((resolve, reject) => {
    const url = `https://commons.wikimedia.org/w/api.php?action=query&titles=File:${encodeURIComponent(filename)}&prop=imageinfo&iiprop=url&iiurlwidth=800&format=json`;
    https.get(url, { headers: { 'User-Agent': 'QuickBiteBot/1.0 (test@college.edu)' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const pages = json.query.pages;
          const pageId = Object.keys(pages)[0];
          const info = pages[pageId].imageinfo;
          if (info && info[0]) {
            resolve(info[0].thumburl || info[0].url);
          } else {
            resolve(null);
          }
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function searchWiki(query) {
  return new Promise((resolve, reject) => {
    const url = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&srnamespace=6&format=json`;
    https.get(url, { headers: { 'User-Agent': 'QuickBiteBot/1.0 (test@college.edu)' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json.query.search);
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function run() {
  console.log('Searching for Rajma Chawal...');
  const results = await searchWiki('Rajma chawal');
  console.log('Search results:', results.slice(0, 3).map(r => r.title));
  if (results[0]) {
    const fileTitle = results[0].title.replace(/^File:/, '');
    const directUrl = await getWikiImageUrl(fileTitle);
    console.log('Direct image URL:', directUrl);
  }
}

run().catch(console.error);
