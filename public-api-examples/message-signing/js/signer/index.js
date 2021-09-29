const axios = require('axios').default;
const crypto = require('crypto');
const fs = require('fs');

const keyUid = 'aaa-bbb';
const baseURL = 'https://api-sandbox.starlingbank.com';
const baseBaaSURL = '/api/v2/onboard';
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

const calculateOAuthAuthorisationAndDigest = (
  method,
  url,
  data,
  accessToken
) => {
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
    authorization: `Bearer ${accessToken};Signature keyid="${keyUid}",algorithm="rsa-sha512",headers="(request-target) Date Digest",signature="${signature}"`
  };
};

const makeRequest = async ({
  url,
  method,
  authorization,
  digest,
  data = ''
}) => {
  console.log('-------------------');
  console.log(`Request to: ${url}`);
  const response = await axios.request({
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

const createPerson = async (mobileNumber) => {
  const method = 'post';
  const url = `${baseBaaSURL}`;
  const data = {
    externalIdentifier: 'ABC1',
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

const generateDocumentUploadUrl = async (
  onboardingPath,
  contentMd5,
  contentType
) => {
  const method = 'put';
  const url = `${onboardingPath}/identity/upload-url`;
  const data = {
    mimeType: contentType,
    md5Checksum: contentMd5
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
  return await axios.request({
    url: presignedUrl,
    method: 'PUT',
    data: imageFile,
    headers: { 'Content-Type': 'image/png', 'Content-MD5': contentMd5 }
  });
};

const uploadVideoToS3 = async (presignedUrl, contentMd5) => {
  const video = fs.readFileSync('video.mp4');
  return await axios.request({
    url: presignedUrl,
    method: 'PUT',
    data: video,
    headers: { 'Content-Type': 'video/mp4', 'Content-MD5': contentMd5 }
  });
};

const confirmDocUploaded = async (onboardingPath, identityUploadUid) => {
  const method = 'put';
  const url = `${onboardingPath}/identity/${identityUploadUid}/confirm-image-upload`;
  const data = {
    idDocumentImageType: 'ID_PHOTO_FRONT',
    idDocumentType: 'FULL_DRIVING_LICENSE',
    filename: 'license.png'
  };

  const { digest, authorization } = calculateAuthorisationAndDigest(
    method,
    url,
    data
  );

  return await makeRequest({ url, method, authorization, digest, data });
};

const confirmVideoUploaded = async (
  onboardingPath,
  identityUploadUid,
  phraseUid
) => {
  const method = 'put';
  const url = `${onboardingPath}/identity/${identityUploadUid}/confirm-video-upload`;
  const data = {
    phraseUid: phraseUid,
    filename: 'video.mp4'
  };

  const { digest, authorization } = calculateAuthorisationAndDigest(
    method,
    url,
    data
  );

  return await makeRequest({ url, method, authorization, digest, data });
};

const generateVideoVerificationPhrase = async (onboardingPath) => {
  const method = 'put';
  const url = `${onboardingPath}/identity/phrases`;
  const data = {};

  const { digest, authorization } = calculateAuthorisationAndDigest(
    method,
    url,
    data
  );

  return await makeRequest({ url, method, authorization, digest, data });
};

const getIncomeBands = async () => {
  const method = 'get';
  const url = `${baseBaaSURL}/income-bands`;
  const data = {};

  const { digest, authorization } = calculateAuthorisationAndDigest(
    method,
    url,
    data
  );

  return await makeRequest({ url, method, authorization, digest, data });
};

const getSourcesOfFunds = async () => {
  const method = 'get';
  const url = `${baseBaaSURL}/sources-of-funds`;
  const data = {};

  const { digest, authorization } = calculateAuthorisationAndDigest(
    method,
    url,
    data
  );

  return await makeRequest({ url, method, authorization, digest, data });
};

const getEmploymentSectors = async () => {
  const method = 'get';
  const url = `${baseBaaSURL}/employment-sectors`;
  const data = {};

  const { digest, authorization } = calculateAuthorisationAndDigest(
    method,
    url,
    data
  );

  return await makeRequest({ url, method, authorization, digest, data });
};

const fetchTerms = async (onboardingPath) => {
  const method = 'get';
  const url = `${onboardingPath}/terms`;
  const data = {};

  const { digest, authorization } = calculateAuthorisationAndDigest(
    method,
    url,
    data
  );

  return await makeRequest({ url, method, authorization, digest, data });
};

const acceptTermsAndSubmit = async (onboardingPath) => {
  const method = 'put';
  const url = `${onboardingPath}/submission`;
  const data = {
    acceptedTerms: [
      { termDocumentName: 'GeneralTerms', version: 5 },
      { termDocumentName: 'PersonalSchedule', version: 4 },
      {
        termDocumentName: 'FinancialCompensationSchemeInformation',
        version: 3
      },
      { termDocumentName: 'FeesAndLimits', version: 11 },
      { termDocumentName: 'StarlingBankPrivacyPolicy', version: 7 }
    ],
    personIncomeDeclaration: {
      incomeBand: 'LESS_THAN_15000',
      currencyCode: 'GBP',
      sourcesOfFunds: ['BENEFITS']
    }
  };

  const { digest, authorization } = calculateAuthorisationAndDigest(
    method,
    url,
    data
  );

  return await makeRequest({ url, method, authorization, digest, data });
};

const fetchOutstandingActions = async (onboardingPath) => {
  const method = 'get';
  const url = `${onboardingPath}/status`;
  const data = {};

  const { digest, authorization } = calculateAuthorisationAndDigest(
    method,
    url,
    data
  );

  return await makeRequest({ url, method, authorization, digest, data });
};

const fetchLatestTaxDeclaration = async (onboardingPath) => {
  const method = 'get';
  const url = `${onboardingPath}/tax-liability-declaration`;
  const data = {};

  const { digest, authorization } = calculateAuthorisationAndDigest(
    method,
    url,
    data
  );

  return await makeRequest({ url, method, authorization, digest, data });
};

const fetchTaxLiabilityCountries = async () => {
  const method = 'get';
  const url = `${baseBaaSURL}/tax-liability-declaration/countries`;
  const data = {};

  const { digest, authorization } = calculateAuthorisationAndDigest(
    method,
    url,
    data
  );

  return await makeRequest({ url, method, authorization, digest, data });
};

const submitTaxDeclaration = async (onboardingPath) => {
  const method = 'put';
  const url = `${onboardingPath}/tax-liability-declaration`;
  const data = {
    taxLiabilityDeclarationAnswer: 'YES',
    countryDeclarations: [
      { countryCode: 'US', taxIdentificationNumber: 'NNN-NN-NNNN' }
    ]
  };

  const { digest, authorization } = calculateAuthorisationAndDigest(
    method,
    url,
    data
  );

  return await makeRequest({ url, method, authorization, digest, data });
};

const resubmit = async (onboardingPath) => {
  const method = 'put';
  const url = `${onboardingPath}/re-submission`;
  const data = {};

  const { digest, authorization } = calculateAuthorisationAndDigest(
    method,
    url,
    data
  );

  return await makeRequest({ url, method, authorization, digest, data });
};

const sendAcceptedTerms = async (onboardingPath) => {
  const method = 'put';
  const url = `${onboardingPath}/terms`;
  const data = {
    acceptedTerms: [
      { termDocumentName: 'GeneralTerms', version: 5 },
      { termDocumentName: 'PersonalSchedule', version: 4 },
      {
        termDocumentName: 'FinancialCompensationSchemeInformation',
        version: 3
      },
      { termDocumentName: 'FeesAndLimits', version: 11 },
      { termDocumentName: 'StarlingBankPrivacyPolicy', version: 7 }
    ]
  };

  const { digest, authorization } = calculateAuthorisationAndDigest(
    method,
    url,
    data
  );

  return await makeRequest({ url, method, authorization, digest, data });
};

const sendIncomeAndEmploymentDetails = async (onboardingPath) => {
  const method = 'put';
  const url = `${onboardingPath}/income`;
  const data = {
    personIncomeDeclaration: {
      incomeBand: 'BAND_1',
      currencyCode: 'GBP',
      sourcesOfFunds: ['MONTHLY_SALARY']
    },
    employmentDeclaration: {
      employmentSector: 'BUSINESS_SERVICES',
      employerRegulationStatus: 'NOT_ASKED'
    }
  };

  const { digest, authorization } = calculateAuthorisationAndDigest(
    method,
    url,
    data
  );

  return await makeRequest({ url, method, authorization, digest, data });
};
const submitApplication = async (onboardingPath) => {
  const method = 'put';
  const url = `${onboardingPath}/submission`;
  const data = {};

  const { digest, authorization } = calculateAuthorisationAndDigest(
    method,
    url,
    data
  );

  return await makeRequest({ url, method, authorization, digest, data });
};

const createAccountHolder = async (onboardingPath) => {
  const method = 'put';
  const url = `${onboardingPath}/account-holders`;
  const data = {
    accountCurrency: 'GBP'
  };

  const { digest, authorization } = calculateAuthorisationAndDigest(
    method,
    url,
    data
  );

  return await makeRequest({ url, method, authorization, digest, data });
};

const getAccounts = async (accessToken) => {
  const method = 'get';
  const url = `/api/v2/accounts`;
  const data = {};

  const { digest, authorization } = calculateOAuthAuthorisationAndDigest(
    method,
    url,
    data,
    accessToken
  );

  return await makeRequest({ url, method, authorization, digest, data });
};

const getAccountHolderName = async (accessToken) => {
  const method = 'get';
  const url = `/api/v2/account-holder/name`;
  const data = {};

  const { digest, authorization } = calculateOAuthAuthorisationAndDigest(
    method,
    url,
    data,
    accessToken
  );

  return await makeRequest({ url, method, authorization, digest, data });
};

// --- ONBOARD ---
const onboard = async (mobileNumber) => {
  const imageMd5 = 'bqZVYjU0gYnPeDsOh2bsCw==';
  const videoMd5 = '1B2M2Y8AsgTpgAmY7PhCfg==';

  const {
    request: {
      res: {
        headers: { location: onboardingPath }
      }
    }
  } = await createPerson(mobileNumber);
  const { data: photoUrlData } = await generateDocumentUploadUrl(
    onboardingPath,
    imageMd5,
    'image/png'
  );

  await fetchOutstandingActions(onboardingPath);
  await uploadImageToS3(photoUrlData.url, imageMd5);
  await confirmDocUploaded(onboardingPath, photoUrlData.identityUploadUid);
  const {
    data: { phraseUid }
  } = await generateVideoVerificationPhrase(onboardingPath);
  const { data: videoUrlData } = await generateDocumentUploadUrl(
    onboardingPath,
    videoMd5,
    'video/mp4'
  );
  await uploadVideoToS3(videoUrlData.url, videoMd5);
  await confirmVideoUploaded(
    onboardingPath,
    videoUrlData.identityUploadUid,
    phraseUid
  );
  await getIncomeBands();
  await getSourcesOfFunds();
  await getEmploymentSectors();
  await sendIncomeAndEmploymentDetails(onboardingPath);

  await fetchTerms(onboardingPath);
  await sendAcceptedTerms(onboardingPath);

  await submitApplication(onboardingPath);

  console.log('Onboarding application complete');
  console.log(`Mobile number: ${mobileNumber}`);
  console.log(`Onboarding uid: ${onboardingPath.split('/')[4]}`);
  return onboardingPath.split('/')[4];
};

const main = async () => {
  try {
    const mobileNumber = '7963578511';
    await onboard(mobileNumber);

    // const {
    //   data: {
    //     authTokens: { accessToken }
    //   }
    // } = await createAccountHolder('a1e32a56-682f-4553-bc8a-e2de0c385332');
    // await getAccounts(accessToken);
    // await getAccountHolderName(accessToken);
  } catch (err) {
    if (err.response) {
      console.error(`Status code: ${err.response.status}`);
      console.error(`Status message: ${err.response.statusText}`);
      console.error(`Response data: ${JSON.stringify(err.response.data)}`);
    } else {
      console.error(`Error: ${err}`);
    }
  }
};

main();
