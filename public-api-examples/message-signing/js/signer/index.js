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
  const method = 'put';
  const url = `${baseBaaSURL}`;
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

const generateDocumentUploadUrl = async (
  onboardingUid,
  contentMd5,
  contentType
) => {
  const method = 'put';
  const url = `${baseBaaSURL}/${onboardingUid}/identity/upload-url`;
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

const confirmDocUploaded = async (onboardingUid, identityUploadUid) => {
  const method = 'put';
  const url = `${baseBaaSURL}/${onboardingUid}/identity/${identityUploadUid}/confirm-image-upload`;
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
  onboardingUid,
  identityUploadUid,
  phraseUid
) => {
  const method = 'put';
  const url = `${baseBaaSURL}/${onboardingUid}/identity/${identityUploadUid}/confirm-video-upload`;
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

const generateVideoVerificationPhrase = async (onboardingUid) => {
  const method = 'put';
  const url = `${baseBaaSURL}/${onboardingUid}/identity/phrases`;
  const data = {};

  const { digest, authorization } = calculateAuthorisationAndDigest(
    method,
    url,
    data
  );

  return await makeRequest({ url, method, authorization, digest, data });
};

const getIncomeBands = async (onboardingUid) => {
  const method = 'get';
  const url = `${baseBaaSURL}/${onboardingUid}/income-bands`;
  const data = {};

  const { digest, authorization } = calculateAuthorisationAndDigest(
    method,
    url,
    data
  );

  return await makeRequest({ url, method, authorization, digest, data });
};

const fetchTerms = async (onboardingUid) => {
  const method = 'get';
  const url = `${baseBaaSURL}/${onboardingUid}/person-terms`;
  const data = {};

  const { digest, authorization } = calculateAuthorisationAndDigest(
    method,
    url,
    data
  );

  return await makeRequest({ url, method, authorization, digest, data });
};

const acceptTermsAndSubmit = async (onboardingUid) => {
  const method = 'put';
  const url = `${baseBaaSURL}/${onboardingUid}/submission`;
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

const fetchOutstandingActions = async (onboardingUid) => {
  const method = 'get';
  const url = `${baseBaaSURL}/${onboardingUid}/status`;
  const data = {};

  const { digest, authorization } = calculateAuthorisationAndDigest(
    method,
    url,
    data
  );

  return await makeRequest({ url, method, authorization, digest, data });
};

const fetchLatestTaxDeclaration = async (onboardingUid) => {
  const method = 'get';
  const url = `${baseBaaSURL}/${onboardingUid}/tax-liability-declaration`;
  const data = {};

  const { digest, authorization } = calculateAuthorisationAndDigest(
    method,
    url,
    data
  );

  return await makeRequest({ url, method, authorization, digest, data });
};

const fetchTaxLiabilityCountries = async (onboardingUid) => {
  const method = 'get';
  const url = `${baseBaaSURL}/${onboardingUid}/tax-liability-declaration/countries`;
  const data = {};

  const { digest, authorization } = calculateAuthorisationAndDigest(
    method,
    url,
    data
  );

  return await makeRequest({ url, method, authorization, digest, data });
};

const submitTaxDeclaration = async (onboardingUid) => {
  const method = 'put';
  const url = `${baseBaaSURL}/${onboardingUid}/tax-liability-declaration`;
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

const resubmit = async (onboardingUid) => {
  const method = 'put';
  const url = `${baseBaaSURL}/${onboardingUid}/re-submission`;
  const data = {};

  const { digest, authorization } = calculateAuthorisationAndDigest(
    method,
    url,
    data
  );

  return await makeRequest({ url, method, authorization, digest, data });
};

const sendAcceptedTerms = async (onboardingUid) => {
  const method = 'put';
  const url = `${baseBaaSURL}/${onboardingUid}/terms`;
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

const sendIncomeAndEmploymentDetails = async (onboardingUid) => {
  const method = 'put';
  const url = `${baseBaaSURL}/${onboardingUid}/income`;
  const data = {
    personIncomeDeclaration: {
      incomeBand: 'FROM_15000_TO_29000',
      currencyCode: 'GBP',
      sourcesOfFunds: ['FRIENDS_AND_FAMILY']
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
const submitApplication = async (onboardingUid) => {
  const method = 'put';
  const url = `${baseBaaSURL}/${onboardingUid}/submissionV2`;
  const data = {};

  const { digest, authorization } = calculateAuthorisationAndDigest(
    method,
    url,
    data
  );

  return await makeRequest({ url, method, authorization, digest, data });
};

const createAccountHolder = async (onboardingUid) => {
  const method = 'put';
  const url = `${baseBaaSURL}/${onboardingUid}/account-holders`;
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

const onboard = async (mobileNumber) => {
  const imageMd5 = 'bqZVYjU0gYnPeDsOh2bsCw==';
  const videoMd5 = '1B2M2Y8AsgTpgAmY7PhCfg==';
  try {
    const createResponse = await createPerson(mobileNumber);
    const onboardingUid = createResponse.data.onboardingUid;
    const photoUrlResponse = await generateDocumentUploadUrl(
      onboardingUid,
      imageMd5,
      'image/png'
    );
    await uploadImageToS3(photoUrlResponse.data.url, imageMd5);
    await confirmDocUploaded(
      onboardingUid,
      photoUrlResponse.data.identityUploadUid
    );
    const phraseResponse = await generateVideoVerificationPhrase(onboardingUid);
    const videoUrlResponse = await generateDocumentUploadUrl(
      onboardingUid,
      videoMd5,
      'video/mp4'
    );
    await uploadVideoToS3(videoUrlResponse.data.url, videoMd5);
    await confirmVideoUploaded(
      onboardingUid,
      videoUrlResponse.data.identityUploadUid,
      phraseResponse.data.phraseUid
    );
    await fetchOutstandingActions(onboardingUid);
    await getIncomeBands(onboardingUid);
    await fetchTerms(onboardingUid);
    await fetchTaxLiabilityCountries(onboardingUid);
    await submitTaxDeclaration(onboardingUid);
    await fetchLatestTaxDeclaration(onboardingUid);

    await sendAcceptedTerms(onboardingUid);
    await sendIncomeAndEmploymentDetails(onboardingUid);

    await submitApplication(onboardingUid);

    console.log("Onboarding application complete")
    console.log(`Mobile number: ${mobileNumber}`)
    console.log(`Onboarding uid: ${onboardingUid}`)
    return onboardingUid;
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

const main = async () => {
  const mobileNumber = '07411218835';
  await onboard(mobileNumber);

  // await createAccountHolder(onboardingUid);
}

main();
