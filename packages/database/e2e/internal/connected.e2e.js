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

const { PATH } = require('../helpers');
const TEST_PATH = `${PATH}/connected`;

describe("database().ref('.info/connected')", function () {
  describe('v8 compatibility', function () {
    beforeEach(async function beforeEachTest() {
      // @ts-ignore
      globalThis.RNFB_SILENCE_MODULAR_DEPRECATION_WARNINGS = true;
      await firebase.database().goOnline();
    });

    afterEach(async function afterEachTest() {
      // Ensures the db is online before running each test
      await firebase.database().goOnline();

      // @ts-ignore
      globalThis.RNFB_SILENCE_MODULAR_DEPRECATION_WARNINGS = false;
    });

    xit('returns true when used with once', async function () {
      const snapshot = await firebase.database().ref('.info/connected').once('value');
      snapshot.val().should.equal(true);
    });

    xit('returns true when used with once with a previous call', async function () {
      await firebase.database().ref(`${TEST_PATH}/foo`).once('value');
      const snapshot = await firebase.database().ref('.info/connected').once('value');
      snapshot.val().should.equal(true);
    });

    // FIXME on android this can work against the emulator
    // on iOS it doesn't work at all ?
    xit('subscribes to online state', async function () {
      const callback = sinon.spy();
      const ref = firebase.database().ref('.info/connected');
      const handler = $ => {
        callback($.val());
      };

      ref.on('value', handler);
      await firebase.database().goOffline();
      await Utils.sleep(1000); // FIXME why is this sleep needed here? callback is called immediately
      await firebase.database().goOnline();
      ref.off('value', handler);

      await Utils.spyToBeCalledTimesAsync(callback, 2);
      callback.getCall(0).args[0].should.equal(false);
      callback.getCall(1).args[0].should.equal(true);
    });
  });

  describe('modular', function () {
    before(async function () {
      const { getDatabase, goOnline } = databaseModular;

      await goOnline(getDatabase());
    });

    after(async function () {
      const { getDatabase, goOnline } = databaseModular;

      await goOnline(getDatabase());
    });

    xit('returns true when used with once', async function () {
      const { getDatabase, ref, get } = databaseModular;

      const snapshot = await get(ref(getDatabase(), '.info/connected'), dbRef);
      snapshot.val().should.equal(true);
    });

    xit('returns true when used with once with a previous call', async function () {
      const { getDatabase, ref, get } = databaseModular;

      await get(ref(getDatabase(), `${TEST_PATH}/foo`));
      const snapshot = await firebase.database().ref('.info/connected').once('value');
      snapshot.val().should.equal(true);
    });

    // FIXME on android this can work against the emulator
    // on iOS it doesn't work at all ?
    xit('subscribes to online state', async function () {
      const { getDatabase, ref, onValue, goOffline, goOnline, off } = databaseModular;
      const db = getDatabase();

      const callback = sinon.spy();
      const dbRef = ref(db, '.info/connected');
      const handler = $ => {
        callback($.val());
      };

      onValue(dbRef, handler);
      await goOffline(db);
      await Utils.sleep(1000); // FIXME why is this sleep needed here? callback is called immediately
      await goOnline(db);
      off('value', handler);

      await Utils.spyToBeCalledTimesAsync(callback, 2);
      callback.getCall(0).args[0].should.equal(false);
      callback.getCall(1).args[0].should.equal(true);
    });
  });
});
