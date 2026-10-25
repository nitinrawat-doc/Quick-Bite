const fs = require('fs');
const https = require('https');

const urlToItems = JSON.parse(fs.readFileSync('url_to_items.json', 'utf8'));
const urls = Object.keys(urlToItems);

function fetchUrlInfo(imageUrl) {
  return new Promise((resolve) => {
    if (!imageUrl.includes('unsplash.com')) {
      resolve({ imageUrl, title: 'Local image', desc: '' });
      return;
    }
    const match = imageUrl.match(/photo-([a-zA-Z0-9-]+)/);
    if (!match) {
      resolve({ imageUrl, title: 'Unknown unsplash', desc: '' });
      return;
    }
    const photoId = match[1];
    // Unsplash web page URL
    const reqUrl = `https://unsplash.com/photos/${photoId}`;
    const req = https.get(reqUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    }, (res) => {
      // Follow redirect if 301/302
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        let loc = res.headers.location;
        if (loc.startsWith('/')) loc = 'https://unsplash.com' + loc;
        https.get(loc, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        }, (res2) => {
          let html = '';
          res2.on('data', c => html += c);
          res2.on('end', () => {
            const titleMatch = html.match(/<title>([^<]*)<\/title>/i);
            const ogTitle = html.match(/<meta property="og:title" content="([^"]*)"/i);
            const ogDesc = html.match(/<meta property="og:description" content="([^"]*)"/i);
            resolve({
              imageUrl,
              photoId,
              title: (titleMatch ? titleMatch[1] : (ogTitle ? ogTitle[1] : '')),
              desc: (ogDesc ? ogDesc[1] : '')
            });
          });
        }).on('error', e => resolve({ imageUrl, photoId, error: e.message }));
        return;
      }

      let html = '';
      res.on('data', c => html += c);
      res.on('end', () => {
        const titleMatch = html.match(/<title>([^<]*)<\/title>/i);
        const ogTitle = html.match(/<meta property="og:title" content="([^"]*)"/i);
        const ogDesc = html.match(/<meta property="og:description" content="([^"]*)"/i);
        resolve({
          imageUrl,
          photoId,
          title: (titleMatch ? titleMatch[1] : (ogTitle ? ogTitle[1] : '')),
          desc: (ogDesc ? ogDesc[1] : '')
        });
      });
    });
    req.on('error', e => resolve({ imageUrl, photoId, error: e.message }));
  });
}

async function main() {
  console.log(`Fetching metadata for ${urls.length} images...`);
  const results = {};
  for (let i = 0; i < urls.length; i++) {
    const u = urls[i];
    const info = await fetchUrlInfo(u);
    results[u] = {
      photoId: info.photoId,
      title: info.title,
      items: urlToItems[u].map(item => ({ name: item.name, category: item.category, desc: item.description }))
    };
    process.stdout.write(`\rDone ${i+1}/${urls.length}`);
  }
  console.log('\nFinished.');
  fs.writeFileSync('photo_audit_results.json', JSON.stringify(results, null, 2));
}

main();
