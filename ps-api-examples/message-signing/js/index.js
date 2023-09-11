const axios = require('axios').default;
const crypto = require('crypto');
const fs = require('fs');
const { v4 } = require('uuid');

const baseURL = 'https://payment-api-sandbox.starlingbank.com';
const privateKeyPath = 'starling-api-private.key';
const apiKeyUid = 'dd24816f-a924-4b30-b8d4-b93ec50041cb';
const paymentBusinessUid = '06cc7011-c386-4b31-a4d6-5fdef50fe8e6';
const accountUid = 'f1a1f8c9-908f-4765-bb4c-9509d0d63757';
const addressUid = 'ea31aea0-e70b-417b-b526-cd211e2b7ed3';
const sortCode = '040059';

// address uids:
// ea31aea0-e70b-417b-b526-cd211e2b7ed3 - expenses
// ac: 27227040
// sc: 040059
// a920d522-ecba-4fca-a9f3-19c3044fb8cf - test

const calculateAuthorisationAndDigest = (date, method, url, data = '') => {
    const digest = data === ''
        ? ''
        : crypto
            .createHash('sha512')
            .update(JSON.stringify(data))
            .digest('base64');

    const signature = crypto
        .createSign('RSA-SHA512')
        .update(`(request-target): ${method} ${url}\nDate: ${date}\nDigest: ${digest}`)
        .sign(fs.readFileSync(privateKeyPath), 'base64');

    return {
        digest,
        authorization: `Signature keyid="${apiKeyUid}",algorithm="rsa-sha512",headers="(request-target) Date Digest",signature="${signature}"`
    };
};

const makeRequest = ({ url, method, authorization, date, digest, data = '' }) => axios.request({
    baseURL,
    url,
    method,
    data,
    headers: {
        Authorization: authorization,
        Date: date,
        Digest: digest,
        'Content-Type': 'application/json',
        'User-Agent': 'api-samples/message-signing/js/ps-signing'
    }
})
    .then(response => console.log(response.data))
    .catch(err => {
        console.error(err.response.status)
        console.error(err.response.statusText)
        console.error(err.response.data)
    });

const getAccount = () => {
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUid}/account/${accountUid}`;
    const method = 'get';

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url);

    return makeRequest({ url, method, authorization, date, digest });
};

const getAddressPayments = () => {
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUid}/account/${accountUid}/address/${addressUid}/payment`;
    const method = 'get';

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url);

    return makeRequest({ url, method, authorization, date, digest });
};

const putAddress = () => {
    const addressUid = v4();
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUid}/account/${accountUid}/address/${addressUid}`;
    const method = 'put';
    const data = {
        accountName: 'My Account Name',
        sortCode
    };

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url, data);

    return makeRequest({ url, method, data, authorization, date, digest });
};

const sendPayment = () => {
    const paymentUid = v4();
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUid}/account/${accountUid}/address/${addressUid}/payment/${paymentUid}/domestic`;
    const method = 'put';
    const data = {
        currencyAndAmount:  {
            currency: "GBP",
            minorUnits: 5000
        },
        domesticInstructionAccount: {
            accountName: "Jesse Venture",
            accountNumber: "09027444",
            sortCode: "070116"
        },
        reference: "outbound fps",
        type: "SOP"
    };

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url, data);

    return makeRequest({ url, method, data, authorization, date, digest });
}

const sendPOO = () => {
    const paymentUid = v4();
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUid}/account/${accountUid}/payment/${paymentUid}/domestic-originating-overseas`;
    const method = 'put';
    const data = {
        amountInDestinationCurrency: {
            currency: "GBP",
            minorUnits: 9000
        },
        amountInOriginalCurrency: {
            currency: "EUR",
            minorUnits: 10001
        },
        exchangeRate: 0.9,
        destinationAccount: {
            accountName: "Jesse Venture",
            accountNumber: "09027444",
            sortCode: "070116"
        },
        overseasInstructingAccount: {
            accountAddress: {
                countryCode: "DE",
                lineOne: "175 Schultz Av",
                lineTwo: "Berg",
                lineThree: "Munich",
                lineFour: "DE0556K",
            },
            accountDetails: {
                bic: "SOGEDEFF",
                iban: "DE75512108001245126199"
            },
            accountBusiness: {
                businessName: "Alpha Co"
            }
        },
        reference: "outbound poo"
    };

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url, data);

    return makeRequest({ url, method, data, authorization, date, digest });
}

const enableBacs = () => {
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUid}/account/${accountUid}/address/${addressUid}/bacs-payments-status`;
    const method = 'put';
    const data = {
        directCreditPaymentsStatus: "ENABLED",
        directDebitPaymentsStatus: "ENABLED"
    };

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url, data);

    return makeRequest({ url, method, data, authorization, date, digest });
}

const createMandate = () => {
    const mandateUid = v4();
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUid}/account/${accountUid}/address/${addressUid}/mandate/${mandateUid}`;
    const method = 'put';
    const data = {
        originatorName: "ANDYCORP LTD",
        originatorReference: "COFFEE",
        originatorServiceUserNumber: "424242"
    };

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url, data);

    return makeRequest({ url, method, data, authorization, date, digest });
}

const getMandates = () => {
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUid}/account/${accountUid}/address/${addressUid}/mandate`;
    const method = 'get';

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url);

    return makeRequest({ url, method, authorization, date, digest });
}

const getMandatePayments = () => {
    const mandateUid = "c025819a-694a-4873-982f-c35275120399"
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUid}/account/${accountUid}/address/${addressUid}/mandate/${mandateUid}/payment`;
    const method = 'get';

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url);

    return makeRequest({ url, method, authorization, date, digest });
}

const disputeBacsPayment = () => {
    const mandateUid = "c025819a-694a-4873-982f-c35275120399"
    const paymentUid = "4f8e2332-09e9-4b43-871a-255656013d2f"
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUid}/account/${accountUid}/address/${addressUid}/mandate/${mandateUid}/payment/${paymentUid}/dispute`;
    const method = 'put';
    const data = {
        disputeType: "NO_ADVANCED_NOTICE_RECEIVED"
    };

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url, data);

    return makeRequest({ url, method, data, authorization, date, digest });
}

const cancelDisputeBacsPayment = () => {
    const mandateUid = "c025819a-694a-4873-982f-c35275120399"
    const paymentUid = "4f8e2332-09e9-4b43-871a-255656013d2f"
    const disputeUid = "4fbd8a53-4347-4680-b74b-8c6034d89757"
    const date = (new Date()).toISOString();
    const url = `/api/v1/${paymentBusinessUid}/account/${accountUid}/address/${addressUid}/mandate/${mandateUid}/payment/${paymentUid}/dispute/${disputeUid}/cancel`
    const method = 'put';

    const { digest, authorization } = calculateAuthorisationAndDigest(date, method, url);

    return makeRequest({ url, method, authorization, date, digest });
}


sendPOO()
    .then((result) => {
        console.log(result)
    })