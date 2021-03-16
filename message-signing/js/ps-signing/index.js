const axios = require('axios').default;
const crypto = require('crypto');
const fs = require('fs');

const baseURL = 'https://payment-api-sandbox.starlingbank.com';
const privateKeyPath = 'starling-api-private.key';
const apiKeyUid = 'KEY_UID';
const paymentBusinessUid = 'PAYMENT_BUSINESS_UID';
const accountUid = 'ACCOUNT_UID';
const date = (new Date()).toISOString();
const url = `/api/v1/${paymentBusinessUid}/account/${accountUid}`;
const method = 'get';
const data = ''; // No payload so no digest needed on a GET

const signature = crypto
    .createSign('RSA-SHA512')
    .update(`(request-target): get ${url}\nDate: ${date}\nDigest: `)
    .sign(fs.readFileSync(privateKeyPath), 'base64');

const authorization = `Signature keyid="${apiKeyUid}",algorithm="rsa-sha512",headers="(request-target) Date Digest",signature="${signature}"`;

axios.request({
    baseURL,
    url,
    method,
    data,
    headers: {
        Authorization: authorization,
        Date: date,
        Digest: '',
        'Content-Type': 'application/json',
        'User-Agent': 'api-samples/message-signing/js/ps-signing'
    }
})
    .then(response => console.log(response.data))
    .catch(err => console.error(err.response))