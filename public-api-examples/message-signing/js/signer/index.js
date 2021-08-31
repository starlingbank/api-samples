const axios = require('axios').default;
const crypto = require('crypto');
const fs = require('fs');
const uuid = require('uuid').v4;

const keyUid = 'aaa-bbb';
const baseURL = 'https://api-sandbox.starlingbank.com';
const date = new Date().toISOString();

const calculateAuthorisationAndDigest = (method, url, data) => {
  const digest =
    data === ''
      ? ''
      : crypto
          .createHash('sha512')
          .update(JSON.stringify(data))
          .digest('base64');

  const signature = crypto
    .createSign('RSA-SHA512')
    .update(
      `(request-target): ${method} ${url}\nDate: ${date}\nDigest: ${digest}`
    )
    .sign(fs.readFileSync('starling-api-private.key'), 'base64');

  return {
    digest,
    authorization: `Signature keyid="${keyUid}",algorithm="rsa-sha512",headers="(request-target) Date Digest",signature="${signature}"`
  };
};

const makeRequest = ({ url, method, authorization, digest, data = '' }) => {
  console.log(`Request to: ${url}`);
  return axios
    .request({
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
    .then((response) => {
      console.log(`Status code: ${response.status}`);
      console.log(response.data);
    });
};

const registerPerson = (personOnboardingUid, mobileNumber) => {
  const method = 'put';
  const url = `/api/v2/onboard/people/${personOnboardingUid}`;
  const data = {
    mobileNumber: mobileNumber,
    title: 'MISS',
    preferredName: 'Bob',
    firstName: 'Gytha',
    middleName: 'Courtney',
    lastName: 'Ogg',
    dateOfBirth: '2000-12-30',
    email: 'gytha.ogg@example.com',
    currentAddress: {
      line1: 'Flat 101',
      line2: 'Hudson House',
      line3: '4 Yeo Street',
      subBuildingName: 'Flat 101',
      buildingName: 'Hudson House',
      buildingNumber: '4',
      thoroughfare: 'Yeo Street',
      dependantLocality: 'Langdon Park',
      postTown: 'London',
      postCode: 'E3 3NU',
      countryCode: 'GB',
      udprn: '52379171',
      umprn: '1234567890',
      from: '2018-01-01',
      to: '2018-01-02'
    },
    previousAddresses: [
      {
        line1: 'Flat 101',
        line2: 'Hudson House',
        line3: '4 Yeo Street',
        subBuildingName: 'Flat 101',
        buildingName: 'Hudson House',
        buildingNumber: '4',
        thoroughfare: 'Yeo Street',
        dependantLocality: 'Langdon Park',
        postTown: 'London',
        postCode: 'E3 3NU',
        countryCode: 'GB',
        udprn: '52379171',
        umprn: '1234567890',
        from: '2018-01-01',
        to: '2018-01-02'
      }
    ]
  };

  const { digest, authorization } = calculateAuthorisationAndDigest(
    method,
    url,
    data
  );

  return await makeRequest({ url, method, authorization, digest, data });
};

const generateUrl = async (personOnboardingUid) => {
  const method = 'put';
  const url = `/api/v2/onboard/people/${personOnboardingUid}/documents/upload-url`;
  const data = {
    contentType: 'image/png',
    contentMd5: 'Qlu5/ZIObKCQNx4xyMUI+w=='
  };

  const { digest, authorization } = calculateAuthorisationAndDigest(
    method,
    url,
    data
  );

  return await makeRequest({ url, method, authorization, digest, data });
};

const confirmDocUploaded = (personOnboardingUid, documentUid) => {
  const method = 'put';
  const url = `/api/v2/onboard/people/${personOnboardingUid}/documents/${documentUid}/confirm-upload`
  const data = {
    documentType: 'ID_PHOTO_FRONT',
    photoIdType: 'FULL_DRIVING_LICENSE',
    filename: 'license.png'
  }

  const { digest, authorization } = calculateAuthorisationAndDigest(
    method,
    url,
    data
  );

  return makeRequest({ url, method, authorization, digest, data });
}

const personOnboardingUid = uuid();
const documentUid = uuid();
const mobileNumber = '+447822699915';

registerPerson(personOnboardingUid, mobileNumber)
  .then(() => {
    const generateUrlRes = generateUrl(personOnboardingUid);
    documentUid = generateUrlRes.response.documentUid;
  })
  .then(() => {
    console.log(documentUid);
    // confirmDocUploaded(personOnboardingUid, documentUid);
  })
  .catch((err) => {
    console.error(`Status code: ${err.response.status}`);
    console.error(`Status message: ${err.response.statusText}`);
    console.error(`Response data: ${JSON.stringify(err.response.data)}`);
  })

const onboard = async () => {
  const personOnboardingUid = uuid();
  try {
    await registerPerson(personOnboardingUid, mobileNumber);
    await generateUrl(personOnboardingUid);
  } catch (err) {
    console.error(`Status code: ${err.response.status}`);
    console.error(`Status message: ${err.response.statusText}`);
    console.error(`Response data: ${JSON.stringify(err.response.data)}`);
  }
}

onboard();