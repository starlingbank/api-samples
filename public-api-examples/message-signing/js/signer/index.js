const axios = require('axios').default;
const crypto = require('crypto');
const fs = require('fs');

const keyUid = 'aaa-bbb';
const baseURL = 'https://api-sandbox.starlingbank.com';
const baseBaaSURL = '/api/v2/onboard';

const calculateAuthorisationAndDigest = (method, url, data) => {
  const date = new Date().toISOString();
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
    authorization: `Signature keyid="${keyUid}",algorithm="rsa-sha512",headers="(request-target) Date Digest",signature="${signature}"`,
    date
  };
};

const calculateOAuthAuthorisationAndDigest = (
  method,
  url,
  data,
  accessToken
) => {
  const date = new Date().toISOString();
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
    authorization: `Bearer ${accessToken};Signature keyid="${keyUid}",algorithm="rsa-sha512",headers="(request-target) Date Digest",signature="${signature}"`,
    date
  };
};

const makeRequest = async ({
  url,
  method,
  authorization,
  digest,
  date,
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
    externalIdentifier: 'ABC3',
    mobileNumber: mobileNumber,
    mobileNumberVerified: true,
    title: 'MISS',
    preferredName: 'Bob',
    firstName: 'Gytha',
    middleName: 'Courtney',
    lastName: 'Ogg',
    dateOfBirth: '2000-12-30',
    email: 'gytha.ogg@example.com',
    currentAddress: {
      postcode: 'E3 3NU',
      postTown: 'London',
      flatIdentifier: '3',
      countryCode: 'GB',
      streetNumber: '3',
      streetName: 'Yeo Street',
      from: '2018-01-01',
      to: '2018-01-02'
    },
    previousAddresses: [
      {
        postcode: 'E3 3NU',
        postTown: 'London',
        countryCode: 'GB',
        flatIdentifier: '3',
        streetNumber: '3',
        streetName: 'Yeo Street',
        from: '2017-01-01',
        to: '2018-01-01'
      }
    ]
  };

  const { digest, authorization, date } = calculateAuthorisationAndDigest(
    method,
    url,
    data
  );

  return await makeRequest({ url, method, authorization, digest, date, data });
};

const updatePersonalInfo = async (onboardingPath) => {
  const method = 'put';
  const url = `${onboardingPath}/personal-info`;
  const data = {
    dateOfBirth: '2001-01-15'
  };

  const { digest, authorization, date } = calculateAuthorisationAndDigest(
    method,
    url,
    data
  );

  return await makeRequest({ url, method, authorization, digest, date, data });
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

  const { digest, authorization, date } = calculateAuthorisationAndDigest(
    method,
    url,
    data
  );

  return await makeRequest({ url, method, authorization, digest, date, data });
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

  const { digest, authorization, date } = calculateAuthorisationAndDigest(
    method,
    url,
    data
  );

  return await makeRequest({ url, method, authorization, digest, date, data });
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

  const { digest, authorization, date } = calculateAuthorisationAndDigest(
    method,
    url,
    data
  );

  return await makeRequest({ url, method, authorization, digest, date, data });
};

const generateVideoVerificationPhrase = async (onboardingPath) => {
  const method = 'put';
  const url = `${onboardingPath}/identity/phrases`;
  const data = {};

  const { digest, authorization, date } = calculateAuthorisationAndDigest(
    method,
    url,
    data
  );

  return await makeRequest({ url, method, authorization, digest, date, data });
};

const getIncomeBands = async () => {
  const method = 'get';
  const url = `${baseBaaSURL}/income-bands`;
  const data = {};

  const { digest, authorization, date } = calculateAuthorisationAndDigest(
    method,
    url,
    data
  );

  return await makeRequest({ url, method, authorization, digest, date, data });
};

const getSourcesOfFunds = async () => {
  const method = 'get';
  const url = `${baseBaaSURL}/sources-of-funds`;
  const data = {};

  const { digest, authorization, date } = calculateAuthorisationAndDigest(
    method,
    url,
    data
  );

  return await makeRequest({ url, method, authorization, digest, date, data });
};

const getEmploymentSectors = async () => {
  const method = 'get';
  const url = `${baseBaaSURL}/employment-sectors`;
  const data = {};

  const { digest, authorization, date } = calculateAuthorisationAndDigest(
    method,
    url,
    data
  );

  return await makeRequest({ url, method, authorization, digest, date, data });
};

const fetchTerms = async (onboardingPath) => {
  const method = 'get';
  const url = `${onboardingPath}/terms`;
  const data = {};

  const { digest, authorization, date } = calculateAuthorisationAndDigest(
    method,
    url,
    data
  );

  return await makeRequest({ url, method, authorization, digest, date, data });
};

const fetchOutstandingActions = async (onboardingPath) => {
  const method = 'get';
  const url = `${onboardingPath}/status`;
  const data = {};

  const { digest, authorization, date } = calculateAuthorisationAndDigest(
    method,
    url,
    data
  );

  return await makeRequest({ url, method, authorization, digest, date, data });
};

const fetchTaxLiabilityCountries = async () => {
  const method = 'get';
  const url = `${baseBaaSURL}/tax-liability-declaration/countries`;
  const data = {};

  const { digest, authorization, date } = calculateAuthorisationAndDigest(
    method,
    url,
    data
  );

  return await makeRequest({ url, method, authorization, digest, date, data });
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

  const { digest, authorization, date } = calculateAuthorisationAndDigest(
    method,
    url,
    data
  );

  return await makeRequest({ url, method, authorization, digest, date, data });
};

const sendAcceptedTerms = async (onboardingPath, personTermsAcceptances) => {
  const method = 'put';
  const url = `${onboardingPath}/terms`;
  const data = {
    acceptedTerms: personTermsAcceptances.map((term) => ({
      termDocumentName: term.documentName,
      version: term.version
    }))
  };

  const { digest, authorization, date } = calculateAuthorisationAndDigest(
    method,
    url,
    data
  );

  return await makeRequest({ url, method, authorization, digest, date, data });
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

  const { digest, authorization, date } = calculateAuthorisationAndDigest(
    method,
    url,
    data
  );

  return await makeRequest({ url, method, authorization, digest, date, data });
};
const submitApplication = async (onboardingPath) => {
  const method = 'put';
  const url = `${onboardingPath}/submission`;
  const data = {};

  const { digest, authorization, date } = calculateAuthorisationAndDigest(
    method,
    url,
    data
  );

  return await makeRequest({ url, method, authorization, digest, date, data });
};

const createAccountHolder = async (onboardingUid) => {
  const method = 'put';
  const url = `${baseBaaSURL}/${onboardingUid}/account-holder`;
  const data = {
    accountCurrency: 'GBP'
  };

  const { digest, authorization, date } = calculateAuthorisationAndDigest(
    method,
    url,
    data
  );

  return await makeRequest({ url, method, authorization, digest, date, data });
};

const getAccounts = async (accessToken) => {
  const method = 'get';
  const url = `/api/v2/accounts`;
  const data = {};

  const { digest, authorization, date } = calculateOAuthAuthorisationAndDigest(
    method,
    url,
    data,
    accessToken
  );

  return await makeRequest({ url, method, authorization, digest, date, data });
};

const getAccountHolderName = async (accessToken) => {
  const method = 'get';
  const url = `/api/v2/account-holder/name`;
  const data = {};

  const { digest, authorization, date } = calculateOAuthAuthorisationAndDigest(
    method,
    url,
    data,
    accessToken
  );

  return await makeRequest({ url, method, authorization, digest, date, data });
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

  const {
    data: { personTermsAcceptances }
  } = await fetchTerms(onboardingPath);
  await sendAcceptedTerms(onboardingPath, personTermsAcceptances);

  await fetchOutstandingActions(onboardingPath);

  await submitApplication(onboardingPath);

  console.log('Onboarding application complete');
  console.log(`Mobile number: ${mobileNumber}`);
  console.log(`Onboarding uid: ${onboardingPath.split('/')[4]}`);
  return onboardingPath.split('/')[4];
};

const main = async () => {
  try {
    const mobileNumber = '7931635125';
    await onboard(mobileNumber);

    // const {
    //   data: {
    //     authTokens: { accessToken }
    //   }
    // } = await createAccountHolder('<onboarding uid>');
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
