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

const { PATH, CONTENT, seed, wipe } = require('../helpers');

const TEST_PATH = `${PATH}/priority`;

describe('database().ref().setPriority()', function () {
  before(async function () {
    await seed(TEST_PATH);
  });

  after(async function () {
    await wipe(TEST_PATH);
  });

  describe('v8 compatibility', function () {
    beforeEach(async function beforeEachTest() {
      // @ts-ignore
      globalThis.RNFB_SILENCE_MODULAR_DEPRECATION_WARNINGS = true;
    });

    afterEach(async function afterEachTest() {
      // @ts-ignore
      globalThis.RNFB_SILENCE_MODULAR_DEPRECATION_WARNINGS = false;
    });

    it('throws if priority is not a valid type', async function () {
      try {
        await firebase.database().ref().setPriority({});
        return Promise.reject(new Error('Did not throw an Error.'));
      } catch (error) {
        error.message.should.containEql("'priority' must be a number, string or null value");
        return Promise.resolve();
      }
    });

    it('throws if onComplete is not a function', async function () {
      try {
        await firebase.database().ref().setPriority(null, 'foo');
        return Promise.reject(new Error('Did not throw an Error.'));
      } catch (error) {
        error.message.should.containEql("'onComplete' must be a function if provided");
        return Promise.resolve();
      }
    });

    it('should correctly set a priority for all non-null values', async function () {
      await Promise.all(
        Object.keys(CONTENT.TYPES).map(async dataRef => {
          const ref = firebase.database().ref(`${TEST_PATH}/types/${dataRef}`);
          await ref.setPriority(1);
          const snapshot = await ref.once('value');
          if (snapshot.val() !== null) {
            snapshot.getPriority().should.eql(1);
          }
        }),
      );
    });

    it('callback if function is passed', async function () {
      const value = Date.now();
      return new Promise(async resolve => {
        await firebase.database().ref(`${TEST_PATH}/types/string`).set(value, resolve);
      });
    });

    it('throws if setting priority on non-existent node', async function () {
      try {
        await firebase.database().ref('tests/siudfhsuidfj').setPriority(1);
        return Promise.reject(new Error('Did not throw error.'));
      } catch (_) {
        // WEB SDK: INVALID_PARAMETERS: could not set priority on non-existent node
        // TODO Get this error? Native code = -999 Unknown
        return Promise.resolve();
      }
    });

    it('throws if permission defined', async function () {
      try {
        await firebase.database().ref('nope/foo').setPriority(1);
        return Promise.reject(new Error('Did not throw error.'));
      } catch (error) {
        error.code.includes('database/permission-denied').should.be.true();
        return Promise.resolve();
      }
    });
  });

  describe('modular', function () {
    it('throws if priority is not a valid type', async function () {
      const { getDatabase, ref, setPriority } = databaseModular;
      const db = getDatabase();
      const dbRef = ref(db);

      try {
        await setPriority(dbRef, {});
        return Promise.reject(new Error('Did not throw an Error.'));
      } catch (error) {
        error.message.should.containEql("'priority' must be a number, string or null value");
        return Promise.resolve();
      }
    });

    it('should correctly set a priority for all non-null values', async function () {
      const { getDatabase, ref, setPriority, get } = databaseModular;

      await Promise.all(
        Object.keys(CONTENT.TYPES).map(async dataRef => {
          const db = getDatabase();
          const dbRef = ref(db, `${TEST_PATH}/types/${dataRef}`);

          await setPriority(dbRef, 1);
          const snapshot = await get(dbRef);
          if (snapshot.val() !== null) {
            snapshot.getPriority().should.eql(1);
          }
        }),
      );
    });

    it('throws if setting priority on non-existent node', async function () {
      const { getDatabase, ref, setPriority } = databaseModular;
      const db = getDatabase();
      const dbRef = ref(db, 'tests/siudfhsuidfj');

      try {
        await setPriority(dbRef, 1);
        return Promise.reject(new Error('Did not throw error.'));
      } catch (_) {
        // WEB SDK: INVALID_PARAMETERS: could not set priority on non-existent node
        // TODO Get this error? Native code = -999 Unknown
        return Promise.resolve();
      }
    });

    it('throws if permission defined', async function () {
      const { getDatabase, ref, setPriority } = databaseModular;
      const db = getDatabase();
      const dbRef = ref(db, 'nope/foo');

      try {
        await setPriority(dbRef, 1);
        return Promise.reject(new Error('Did not throw error.'));
      } catch (error) {
        error.code.includes('database/permission-denied').should.be.true();
        return Promise.resolve();
      }
    });
  });
});
