const express = require('express')
const app = express()
const crypto = require('crypto')
const timingSafeCompare = require('tsscmp')

// Don't hardcode this in production
const SHARED_SECRET = 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa';

const signatureValidation = (req, res, next) => {
  const hash = crypto.createHash('sha512');
  hash.update(SHARED_SECRET);
  hash.update(req.rawBody);
  const calculatedSignature = hash.digest('base64');

  if (!timingSafeCompare(calculatedSignature, req.headers["x-hook-signature"])) {
    // Don't log the signatures in production
    console.warn('Bad webhook signature. Expected', calculatedSignature, 'but was', req.headers["x-hook-signature"])
    return res.status(403).send('Bad webhook signature');
  } else {
    // Don't log the signatures in production
    console.log('Good webhook signature', calculatedSignature)
    return next();
  }
}

app.use(express.json({ verify: (req, res, buf) => req.rawBody = buf.toString() }))

app.post('/', signatureValidation, (req, res) => {
  console.dir(req.body)
  res.status(204).send();
})

app.listen(8000, () => {
  console.log('Listening on port 8000');
})