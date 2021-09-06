const axios = require('axios').default;
const crypto = require('crypto');
const fs = require('fs');
const uuid = require('uuid').v4;

const keyUid = 'aa-bb';
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

const makeRequest = async ({ url, method, authorization, digest, data = '' }) => {
  console.log('-------------------');
  console.log(`Request to: ${url}`);
  const response = await axios
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
        'User-Agent': 'baas-testing'
      }
    });
  console.log(`Status code: ${response.status}`);
  console.log(response.data);
  return response;
};

const createPerson = async (personOnboardingUid, mobileNumber) => {
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

const generateDocumentUploadUrl = async (personOnboardingUid, contentMd5, contentType) => {
  const method = 'put';
  const url = `/api/v2/onboard/people/${personOnboardingUid}/documents/upload-url`;
  const data = {
    contentType,
    contentMd5
  };

  const { digest, authorization } = calculateAuthorisationAndDigest(
    method,
    url,
    data
  );

  return await makeRequest({ url, method, authorization, digest, data });
};

const uploadImageToS3 = async (presignedUrl, contentMd5) => {
  const imageFile = fs.readFileSync('image.png');
  return await axios.request({ url: presignedUrl, method: 'PUT', data: imageFile, headers: { 'Content-Type':  'image/png', 'Content-MD5': contentMd5 } })
};

const uploadVideoToS3 = async (presignedUrl, contentMd5) => {
  const video = fs.readFileSync('video.mp4');
  return await axios.request({ url: presignedUrl, method: 'PUT', data: video, headers: { 'Content-Type':  'video/mp4', 'Content-MD5': contentMd5 } })
};

const confirmDocUploaded = async (personOnboardingUid, documentUid) => {
  const method = 'put';
  const url = `/api/v2/onboard/people/${personOnboardingUid}/documents/${documentUid}/confirm-upload`;
  const data = {
    documentType: 'ID_PHOTO_FRONT',
    photoIdType: 'FULL_DRIVING_LICENSE',
    filename: 'license.png'
  };

  const { digest, authorization } = calculateAuthorisationAndDigest(
    method,
    url,
    data
  );

  return await makeRequest({ url, method, authorization, digest, data });
}

const confirmVideoUploaded = async (personOnboardingUid, documentUid, phraseUid) => {
  const method = 'put';
  const url = `/api/v2/onboard/people/${personOnboardingUid}/videos/phrases/${phraseUid}/confirm-upload`;
  const data = {
    videoUid: documentUid,
    filename: 'video.mp4'
  };

  const { digest, authorization } = calculateAuthorisationAndDigest(
    method,
    url,
    data
  );

  return await makeRequest({ url, method, authorization, digest, data });
}

const generateVideoVerificationPhrase = async (personOnboardingUid) => {
  const method = 'put';
  const url = `/api/v2/onboard/people/${personOnboardingUid}/videos/phrases`;
  const data = {};

  const { digest, authorization } = calculateAuthorisationAndDigest(
    method,
    url,
    data
  );

  return await makeRequest({ url, method, authorization, digest, data });
}

const getIncomeBands = async (personOnboardingUid) => {
  const method = 'get';
  const url = `/api/v2/onboard/people/${personOnboardingUid}/income-bands`;
  const data = {};

  const { digest, authorization } = calculateAuthorisationAndDigest(
    method,
    url,
    data
  );

  return await makeRequest({ url, method, authorization, digest, data });
}

const fetchTerms = async (personOnboardingUid) => {
  const method = 'get';
  const url = `/api/v2/onboard/people/${personOnboardingUid}/person-terms`;
  const data = {};

  const { digest, authorization } = calculateAuthorisationAndDigest(
    method,
    url,
    data
  );

  return await makeRequest({ url, method, authorization, digest, data });
}

const acceptTermsAndSubmit = async (personOnboardingUid) => {
  const method = 'put';
  const url = `/api/v2/onboard/people/${personOnboardingUid}/submission`;
  const data = {
    acceptedTerms: [
      { termDocumentName: 'GeneralTerms', version: 5 },
      { termDocumentName: 'PersonalSchedule', version: 4 },
      { termDocumentName: 'FinancialCompensationSchemeInformation', version: 3 },
      { termDocumentName: 'FeesAndLimits', version: 11 },
      { termDocumentName: 'StarlingBankPrivacyPolicy', version: 7 }
    ],
    personIncomeDeclaration: {
      incomeBand: 'LESS_THAN_15000',
      currencyCode: 'GBP',
      sourcesOfFunds: [
        'BENEFITS'
      ]
    }
  };

  const { digest, authorization } = calculateAuthorisationAndDigest(
    method,
    url,
    data
  );

  return await makeRequest({ url, method, authorization, digest, data });
}

const fetchOutstandingActions = async (personOnboardingUid) => {
  const method = 'get';
  const url = `/api/v2/onboard/people/${personOnboardingUid}/status`;
  const data = {};

  const { digest, authorization } = calculateAuthorisationAndDigest(
    method,
    url,
    data
  );

  return await makeRequest({ url, method, authorization, digest, data });
}

const resubmit = async (personOnboardingUid) => {
  const method = 'put';
  const url = `/api/v2/onboard/people/${personOnboardingUid}/re-submission`;
  const data = {};

  const { digest, authorization } = calculateAuthorisationAndDigest(
    method,
    url,
    data
  );

  return await makeRequest({ url, method, authorization, digest, data });
}

const onboard = async () => {
  const personOnboardingUid = uuid();
  const mobileNumber = '07449618811';
  const imageMd5 = 'bqZVYjU0gYnPeDsOh2bsCw==';
  const videoMd5 = '1B2M2Y8AsgTpgAmY7PhCfg==';
  try {
    await createPerson(personOnboardingUid, mobileNumber);
    const photoUrlResponse = await generateDocumentUploadUrl(personOnboardingUid, imageMd5, 'image/png');
    await uploadImageToS3(photoUrlResponse.data.url, imageMd5);
    await confirmDocUploaded(personOnboardingUid, photoUrlResponse.data.idvDocumentUid);
    const phraseResponse = await generateVideoVerificationPhrase(personOnboardingUid);
    const videoUrlResponse = await generateDocumentUploadUrl(personOnboardingUid, videoMd5, 'video/mp4');
    await uploadVideoToS3(videoUrlResponse.data.url, videoMd5);
    await confirmVideoUploaded(personOnboardingUid, videoUrlResponse.data.idvDocumentUid, phraseResponse.data.phraseUid);
    await fetchOutstandingActions(personOnboardingUid);
    await getIncomeBands(personOnboardingUid);
    await fetchTerms(personOnboardingUid);
    await acceptTermsAndSubmit(personOnboardingUid);
    // await resubmit(personOnboardingUid);

  } catch (err) {
    if (err.response) {
      console.error(`Status code: ${err.response.status}`);
      console.error(`Status message: ${err.response.statusText}`);
      console.error(`Response data: ${JSON.stringify(err.response.data)}`);
    } else {
      console.error(`Error: ${err}`);
    }
  }
}

onboard();
