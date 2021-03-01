const http = require('http')
const crypto = require('crypto')
const timingSafeCompare = require('tsscmp');

// Don't hardcode this in production
const SHARED_SECRET = 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa';

http.createServer((req, res) => {
  const hash = crypto.createHash('sha512');
  hash.update(SHARED_SECRET);

  req.on('data', chunk => {
    hash.update(chunk)
  });

  req.on('end', () => {
    const calculatedSignature = hash.digest('base64');

    if (!timingSafeCompare(calculatedSignature, req.headers["x-hook-signature"])) {
      // Don't log the signatures in production
      console.warn('Bad webhook signature. Expected', calculatedSignature, 'but was', req.headers["x-hook-signature"])
      res.statusCode = 403;
      res.end();
    } else {
      // Don't log the signatures in production
      console.log('Good webhook signature', calculatedSignature)
      res.statusCode = 204;
      res.end();
    }
  });
}).listen(8000, () => {
  console.log('Listening on port 8000');
});