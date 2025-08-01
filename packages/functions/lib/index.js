/*
 * Copyright (c) 2016-present Invertase Limited & Contributors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this library except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */

import { isAndroid, isNumber } from '@react-native-firebase/app/lib/common';
import {
  createModuleNamespace,
  FirebaseModule,
  getFirebaseRoot,
} from '@react-native-firebase/app/lib/internal';
import HttpsError from './HttpsError';
import version from './version';
import { setReactNativeModule } from '@react-native-firebase/app/lib/internal/nativeModule';
import fallBackModule from './web/RNFBFunctionsModule';

const namespace = 'functions';
const nativeModuleName = 'RNFBFunctionsModule';

export const HttpsErrorCode = {
  OK: 'ok',
  CANCELLED: 'cancelled',
  UNKNOWN: 'unknown',
  INVALID_ARGUMENT: 'invalid-argument',
  DEADLINE_EXCEEDED: 'deadline-exceeded',
  NOT_FOUND: 'not-found',
  ALREADY_EXISTS: 'already-exists',
  PERMISSION_DENIED: 'permission-denied',
  UNAUTHENTICATED: 'unauthenticated',
  RESOURCE_EXHAUSTED: 'resource-exhausted',
  FAILED_PRECONDITION: 'failed-precondition',
  ABORTED: 'aborted',
  OUT_OF_RANGE: 'out-of-range',
  UNIMPLEMENTED: 'unimplemented',
  INTERNAL: 'internal',
  UNAVAILABLE: 'unavailable',
  DATA_LOSS: 'data-loss',
  UNSUPPORTED_TYPE: 'unsupported-type',
  FAILED_TO_PARSE_WRAPPED_NUMBER: 'failed-to-parse-wrapped-number',
  // Web codes are lowercase dasherized.
  ok: 'ok',
  cancelled: 'cancelled',
  unknown: 'unknown',
  'invalid-argument': 'invalid-argument',
  'deadline-exceeded': 'deadline-exceeded',
  'not-found': 'not-found',
  'already-exists': 'already-exists',
  'permission-denied': 'permission-denied',
  unauthenticated: 'unauthenticated',
  'resource-exhausted': 'resource-exhausted',
  'failed-precondition': 'failed-precondition',
  aborted: 'aborted',
  'out-of-range': 'out-of-range',
  unimplemented: 'unimplemented',
  internal: 'internal',
  unavailable: 'unavailable',
  'data-loss': 'data-loss',
};

const statics = {
  HttpsErrorCode,
};

class FirebaseFunctionsModule extends FirebaseModule {
  constructor(...args) {
    super(...args);
    this._customUrlOrRegion = this._customUrlOrRegion || 'us-central1';
    this._useFunctionsEmulatorHost = null;
    this._useFunctionsEmulatorPort = -1;
  }

  httpsCallable(name, options = {}) {
    if (options.timeout) {
      if (isNumber(options.timeout)) {
        options.timeout = options.timeout / 1000;
      } else {
        throw new Error('HttpsCallableOptions.timeout expected a Number in milliseconds');
      }
    }

    return data => {
      const nativePromise = this.native.httpsCallable(
        this._useFunctionsEmulatorHost,
        this._useFunctionsEmulatorPort,
        name,
        {
          data,
        },
        options,
      );
      return nativePromise.catch(nativeError => {
        const { code, message, details } = nativeError.userInfo || {};
        return Promise.reject(
          new HttpsError(
            HttpsErrorCode[code] || HttpsErrorCode.UNKNOWN,
            message || nativeError.message,
            details || null,
            nativeError,
          ),
        );
      });
    };
  }

  httpsCallableFromUrl(url, options = {}) {
    if (options.timeout) {
      if (isNumber(options.timeout)) {
        options.timeout = options.timeout / 1000;
      } else {
        throw new Error('HttpsCallableOptions.timeout expected a Number in milliseconds');
      }
    }

    return data => {
      const nativePromise = this.native.httpsCallableFromUrl(
        this._useFunctionsEmulatorHost,
        this._useFunctionsEmulatorPort,
        url,
        {
          data,
        },
        options,
      );
      return nativePromise.catch(nativeError => {
        const { code, message, details } = nativeError.userInfo || {};
        return Promise.reject(
          new HttpsError(
            HttpsErrorCode[code] || HttpsErrorCode.UNKNOWN,
            message || nativeError.message,
            details || null,
            nativeError,
          ),
        );
      });
    };
  }

  useFunctionsEmulator(origin) {
    [_, host, port] = /https?\:.*\/\/([^:]+):?(\d+)?/.exec(origin);
    if (!port) {
      port = 5001;
    }
    this.useEmulator(host, parseInt(port));
  }

  useEmulator(host, port) {
    if (!isNumber(port)) {
      throw new Error('useEmulator port parameter must be a number');
    }

    let _host = host;

    const androidBypassEmulatorUrlRemap =
      typeof this.firebaseJson.android_bypass_emulator_url_remap === 'boolean' &&
      this.firebaseJson.android_bypass_emulator_url_remap;
    if (!androidBypassEmulatorUrlRemap && isAndroid && _host) {
      if (_host.startsWith('localhost')) {
        _host = _host.replace('localhost', '10.0.2.2');
        // eslint-disable-next-line no-console
        console.log(
          'Mapping functions host "localhost" to "10.0.2.2" for android emulators. Use real IP on real devices. You can bypass this behaviour with "android_bypass_emulator_url_remap" flag.',
        );
      }
      if (_host.startsWith('127.0.0.1')) {
        _host = _host.replace('127.0.0.1', '10.0.2.2');
        // eslint-disable-next-line no-console
        console.log(
          'Mapping functions host "127.0.0.1" to "10.0.2.2" for android emulators. Use real IP on real devices. You can bypass this behaviour with "android_bypass_emulator_url_remap" flag.',
        );
      }
    }
    this._useFunctionsEmulatorHost = _host || null;
    this._useFunctionsEmulatorPort = port || -1;
  }
}

// import { SDK_VERSION } from '@react-native-firebase/functions';
export const SDK_VERSION = version;

// import functions from '@react-native-firebase/functions';
// functions().logEvent(...);
export default createModuleNamespace({
  statics,
  version,
  namespace,
  nativeModuleName,
  nativeEvents: false,
  hasMultiAppSupport: true,
  hasCustomUrlOrRegionSupport: true,
  ModuleClass: FirebaseFunctionsModule,
});

export * from './modular';

// import functions, { firebase } from '@react-native-firebase/functions';
// functions().logEvent(...);
// firebase.functions().logEvent(...);
export const firebase = getFirebaseRoot();

// Register the interop module for non-native platforms.
setReactNativeModule(nativeModuleName, fallBackModule);
