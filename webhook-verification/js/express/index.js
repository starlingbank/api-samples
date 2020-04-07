const express = require('express')
const app = express()
const crypto = require('crypto')

// Don't hardcode this in production
const SHARED_SECRET = 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa';

const signatureValidation = (req, res, payload) => {
  const hash = crypto.createHash('sha512');
  hash.update(SHARED_SECRET);
  hash.update(payload);
  const calculatedSignature = hash.digest('base64');

  if (calculatedSignature != req.headers["x-hook-signature"]) {
    console.warn('Bad webhook signature. Expected', calculatedSignature, 'but was', req.headers["x-hook-signature"])
    res.status(403);
    throw new Error('Bad webhook signature')
  } else {
    console.log('Good webhook signature', calculatedSignature)
  }
}

app.use(express.json({ verify: signatureValidation }))

app.post('/', (req, res) => {
  console.dir(req.body)
  res.status(204).send();
})

app.listen(8000)