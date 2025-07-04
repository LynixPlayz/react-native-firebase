/* eslint-disable no-console */
const { getE2eTestProject, getE2eEmulatorHost } = require('../../app/e2e/helpers');

// Call HTTP REST API URL and return JSON response parsed into object
const callRestApi = async function callRestAPI(url, returnRedirectUrl = false) {
  let _url = url;
  if (Platform.android) {
    _url = _url.replace('127.0.0.1', '10.0.2.2');
  }
  const response = await fetch(_url, {
    redirect: returnRedirectUrl ? 'manual' : 'follow',
  });
  if (returnRedirectUrl) {
    return response.url;
  }
  return response.json();
};

function getRandomPhoneNumber() {
  return '+593' + Utils.randString(9, '#19');
}
exports.getRandomPhoneNumber = getRandomPhoneNumber;

exports.clearAllUsers = async function clearAllUsers() {
  // console.error('auth::helpers::clearAllUsers');
  try {
    const response = await fetch(
      'http://' +
        getE2eEmulatorHost() +
        ':9099' +
        '/emulator/v1/projects/' +
        getE2eTestProject() +
        '/accounts',
      {
        method: 'delete',
        headers: { Authorization: 'Bearer owner' },
      },
    );
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const result = await response.json();
    // console.error('received: ' + JSON.stringify(result));
  } catch (e) {
    console.error('Unable to wipe auth:', e);
    throw e;
  }
};

exports.disableUser = async function disableUser(userId) {
  // console.error('auth::helpers::disableUser on userId: ' + userId);
  try {
    const response = await fetch(
      'http://' +
        getE2eEmulatorHost() +
        ':9099' +
        '/identitytoolkit.googleapis.com/v1/projects/' +
        getE2eTestProject() +
        '/accounts:update',
      {
        method: 'post',
        body: JSON.stringify({ disableUser: true, localId: userId }),
        headers: { Authorization: 'Bearer owner', 'Content-Type': 'application/json' },
      },
    );
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const result = await response.json();
    // console.error('received: ' + JSON.stringify(result));
  } catch (e) {
    console.error('Unable to update user:', e);
    throw e;
  }
};

async function getLastSmsCode(specificPhone) {
  let lastSmsCode = null;
  try {
    // console.log('auth::e2e:helpers:getLastSmsCode - start');
    const getSmsCodesUrl =
      'http://' +
      getE2eEmulatorHost() +
      ':9099/emulator/v1/projects/' +
      getE2eTestProject() +
      '/verificationCodes';

    const responseData = await callRestApi(getSmsCodesUrl);

    // Process the codes, the last one in the array is the one...
    // console.log('getLastSmsCode got ', JSON.stringify(responseData, null, 2));
    const codes = responseData ? responseData.verificationCodes : undefined;
    if (codes && codes.length > 0) {
      if (specificPhone) {
        // roll through backwards (to get last valid code) searching for the specific phone
        for (let i = codes.length - 1; i >= 0 && !lastSmsCode; i--) {
          const codeBlock = codes[i];
          if (codeBlock.phoneNumber === specificPhone) {
            lastSmsCode = codeBlock.code;
          }
        }
      } else {
        lastSmsCode = codes[codes.length - 1].code;
      }
    } else {
      throw new Error('There were no unused verification codes');
    }
  } catch (e) {
    console.error('Unable to get SMS Verification codes', e);
    throw e;
  }
  // console.log('getLastSmsCode returning code: ' + lastSmsCode);
  return lastSmsCode;
}
exports.getLastSmsCode = getLastSmsCode;

async function getLastOob(specificEmail) {
  let lastOob = null;
  try {
    // console.log('auth::e2e:helpers:getLastOob - start');
    const getOobCodesUrl =
      'http://' +
      getE2eEmulatorHost() +
      ':9099/emulator/v1/projects/' +
      getE2eTestProject() +
      '/oobCodes';

    const responseData = await callRestApi(getOobCodesUrl);

    // Process the codes, the last one in the array is the one...
    // console.log('getLastOob got ', JSON.stringify(responseData, null, 2));
    const codes = responseData ? responseData.oobCodes : undefined;
    if (codes && codes.length > 0) {
      if (specificEmail) {
        // roll through backwards (to get last valid code) searching for the specific email
        for (let i = codes.length - 1; i >= 0 && !lastOob; i--) {
          const codeBlock = codes[i];
          if (codeBlock.email === specificEmail) {
            lastOob = codeBlock;
          }
        }
      } else {
        lastOob = codes[codes.length - 1];
      }
    } else {
      throw new Error('There were no unused OOB codes');
    }
  } catch (e) {
    console.error('Unable to get Email OOB codes', e);
    throw e;
  }
  // console.log('getLastOob returning code: ' + JSON.stringify(lastOob, null, 2);
  return lastOob;
}
exports.getLastOob = getLastOob;

exports.resetPassword = async function resetPassword(oobCode, newPassword) {
  const resetPasswordUrl =
    'http://' +
    getE2eEmulatorHost() +
    ':9099/emulator/action?mode=resetPassword&lang=en&oobCode=' +
    oobCode +
    '&apiKey=fake-api-key&newPassword=' +
    newPassword;
  return await callRestApi(resetPasswordUrl);
};

async function verifyEmail(oobCode) {
  const verifyEmailUrl =
    'http://' +
    getE2eEmulatorHost() +
    ':9099/emulator/action?mode=verifyEmail&lang=en&oobCode=' +
    oobCode +
    '&apiKey=fake-api-key';
  return await callRestApi(verifyEmailUrl);
}
exports.verifyEmail = verifyEmail;

// This URL comes from the Auth Emulator's oobCode blocks
exports.signInUser = async function signInUser(oobUrl) {
  return await callRestApi(oobUrl, true);
};

async function createVerifiedUser(email, password) {
  const { getAuth, createUserWithEmailAndPassword, reload, sendEmailVerification } = authModular;
  const credential = await createUserWithEmailAndPassword(getAuth(), email, password);
  await sendEmailVerification(credential.user);
  const { oobCode } = await getLastOob(email);
  await verifyEmail(oobCode);
  await reload(credential.user);
  return credential.user;
}
exports.createVerifiedUser = createVerifiedUser;

/**
 * Create a new user with a second factor enrolled. Returns phoneNumber, email and password
 * for testing purposes. The session used to enroll the factor is terminated. You'll have to
 * sign in using `signInWithEmailAndPassword(getAuth())`.
 */
exports.createUserWithMultiFactor = async function createUserWithMultiFactor() {
  const { getAuth, multiFactor, signOut, PhoneAuthProvider, PhoneMultiFactorGenerator } =
    authModular;
  const email = 'verified@example.com';
  const password = 'test123';
  const user = await createVerifiedUser(email, password);
  const multiFactorUser = await multiFactor(user);
  const session = await multiFactorUser.getSession();
  const phoneNumber = getRandomPhoneNumber();
  const verificationId = await new PhoneAuthProvider(getAuth()).verifyPhoneNumber({
    phoneNumber,
    session,
  });
  const verificationCode = await getLastSmsCode(phoneNumber);
  const cred = PhoneAuthProvider.credential(verificationId, verificationCode);
  const multiFactorAssertion = PhoneMultiFactorGenerator.assertion(cred);
  await multiFactorUser.enroll(multiFactorAssertion, 'Hint displayName');
  await signOut(getAuth());

  return Promise.resolve({
    phoneNumber,
    email,
    password,
  });
};

exports.signInUserWithMultiFactor = async function signInUserWithMultiFactor(
  email,
  password,
  phoneNumber,
) {
  const {
    getAuth,
    getMultiFactorResolver,
    signInWithEmailAndPassword,
    PhoneAuthProvider,
    PhoneMultiFactorGenerator,
  } = authModular;
  try {
    await signInWithEmailAndPassword(getAuth(), email, password);
  } catch (e) {
    e.message.should.equal(
      '[auth/multi-factor-auth-required] Please complete a second factor challenge to finish signing into this account.',
    );
    const resolver = getMultiFactorResolver(getAuth(), e);
    let verificationId = await new PhoneAuthProvider(getAuth()).verifyPhoneNumber({
      multiFactorHint: resolver.hints[0],
      session: resolver.session,
    });
    let verificationCode = await getLastSmsCode(phoneNumber);
    const credential = PhoneAuthProvider.credential(verificationId, verificationCode);
    let multiFactorAssertion = PhoneMultiFactorGenerator.assertion(credential);
    return resolver.resolveSignIn(multiFactorAssertion);
  }
};
