const axios = require('axios').default;
const crypto = require('crypto');
const fs = require('fs');
const uuid = require('uuid').v4;

/* Configuration */
const keyUid = 'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb';
const accessToken = 'eyJhbGciOiJQUzI1NiIsInppcCI6I...';
const accountUid = 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa';
const categoryUid = 'cccccccc-cccc-4ccc-cccc-cccccccccccc';

const baseURL = 'https://api-sandbox.starlingbank.com';
const method = 'put';
const url = `/api/v2/payments/local/account/${accountUid}/category/${categoryUid}`;
const date = (new Date()).toISOString();
const data = JSON.stringify({
  externalIdentifier: uuid(),
  paymentRecipient: {
    payeeName: "Elise Gram",
    payeeType: "INDIVIDUAL",
    countryCode: "GB",
    accountIdentifier: "96193830",
    bankIdentifier: "608371",
    bankIdentifierType: "SORT_CODE"
  },
  reference: "From api-samples",
  amount: {
    currency: "GBP",
    minorUnits: 1
  }
});

const digest = crypto
  .createHash('sha512')
  .update(data)
  .digest('base64');

const signature = crypto
  .createSign('RSA-SHA512')
  .update(`(request-target): put ${url}\nDate: ${date}\nDigest: ${digest}`)
  .sign(fs.readFileSync('starling-api-private.key'), 'base64');

const authorization = `Bearer ${accessToken};Signature keyid="${keyUid}",algorithm="rsa-sha512",headers="(request-target) Date Digest",signature="${signature}"`

axios.request({
  baseURL,
  url,
  method,
  data,
  headers: {
    Authorization: authorization,
    Date: date,
    Digest: digest,
    'Content-Type': 'application/json',
    'User-Agent': 'api-samples/message-signing/js/signer'
  }
})
.then(response => console.log(response))
.catch(err => console.error(err.response.data))