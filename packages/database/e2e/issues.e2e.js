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

const { PATH, seed, wipe } = require('./helpers');

const TEST_PATH = `${PATH}/issues`;

describe('database issues', function () {
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

    // FIXME requires a second database set up locally, full app initialization etc
    xit('#2813 should return a null snapshot key if path is root', async function () {
      firebase.database('https://react-native-firebase-testing-db2.firebaseio.com');
      const ref = firebase
        .app()
        .database('https://react-native-firebase-testing-db2.firebaseio.com')
        .ref();
      const snapshot = await ref.once('value');
      should.equal(snapshot.key, null);
    });

    it('#2833 should not mutate modifiers ordering', async function () {
      const callback = sinon.spy();
      const testRef = firebase
        .database()
        .ref()
        .child(TEST_PATH)
        .orderByChild('disabled')
        .equalTo(false);

      testRef._modifiers.toString().should.be.a.String();
      testRef._modifiers.toArray()[0].name.should.equal('orderByChild');

      testRef.on('value', snapshot => {
        callback(snapshot.val());
      });

      await Utils.spyToBeCalledOnceAsync(callback, 3000);

      testRef.off('value');
    });

    it('#100 array should return null where key is missing', async function () {
      const ref = firebase.database().ref(`${TEST_PATH}/issue_100`);

      const data = {
        1: {
          someKey: 'someValue',
          someOtherKey: 'someOtherValue',
        },
        2: {
          someKey: 'someValue',
          someOtherKey: 'someOtherValue',
        },
        3: {
          someKey: 'someValue',
          someOtherKey: 'someOtherValue',
        },
      };

      await ref.set(data);
      const snapshot = await ref.once('value');

      snapshot.val().should.eql([null, data[1], data[2], data[3]]);
    });

    describe('#108 filters correctly by float values', function () {
      it('returns filtered results', async function () {
        const ref = firebase.database().ref(`${TEST_PATH}/issue_108/filter`);

        const data = {
          foobar: {
            name: 'Foobar Pizzas',
            latitude: 34.1013717,
          },
          notTheFoobar: {
            name: "Not the pizza you're looking for",
            latitude: 34.456787,
          },
          notAFloat: {
            name: 'Not a float',
            latitude: 37,
          },
        };

        await ref.set(data);
        const snapshot = await ref
          .orderByChild('latitude')
          .startAt(34.00867000999119)
          .endAt(34.17462960866099)
          .once('value');

        const val = snapshot.val();
        val.foobar.should.eql(data.foobar);

        should.equal(Object.keys(val).length, 1);
      });

      it('returns correct results when not using float values', async function () {
        const ref = firebase.database().ref(`${TEST_PATH}/issue_108/integer`);

        const data = {
          foobar: {
            name: 'Foobar Pizzas',
            latitude: 34.1013717,
          },
          notTheFoobar: {
            name: "Not the pizza you're looking for",
            latitude: 34.456787,
          },
          notAFloat: {
            name: 'Not a float',
            latitude: 37,
          },
        };

        await ref.set(data);
        const snapshot = await ref.orderByChild('latitude').equalTo(37).once('value');

        const val = snapshot.val();

        val.notAFloat.should.eql(data.notAFloat);

        should.equal(Object.keys(val).length, 1);
      });
    });

    it('#489 reutrns long numbers correctly', async function () {
      const LONG = 1508777379000;
      const ref = firebase.database().ref(`${TEST_PATH}/issue_489`);
      await ref.set(LONG);
      const snapshot = await ref.once('value');
      snapshot.val().should.eql(LONG);
    });
  });

  describe('modular', function () {
    // FIXME requires a second database set up locally, full app initialization etc
    xit('#2813 should return a null snapshot key if path is root', async function () {
      const { getDatabase, ref, get } = databaseModular;

      const db = getDatabase(
        /* takes default firebase.app() */ null,
        'https://react-native-firebase-testing-db2.firebaseio.com',
      );
      const dbRef = ref(db);
      const snapshot = await get(dbRef);
      should.equal(snapshot.key, null);
    });

    it('#2833 should not mutate modifiers ordering', async function () {
      const { getDatabase, ref, child, query, equalTo, orderByChild, onValue } = databaseModular;

      const callback = sinon.spy();
      const testRef = query(
        child(ref(getDatabase()), TEST_PATH),
        orderByChild('disabled'),
        equalTo(false),
      );

      testRef._modifiers.toString().should.be.a.String();
      testRef._modifiers.toArray()[0].name.should.equal('orderByChild');

      const unsubscribe = onValue(testRef, snapshot => {
        callback(snapshot.val());
      });

      await Utils.spyToBeCalledOnceAsync(callback, 3000);

      unsubscribe();
    });

    it('#100 array should return null where key is missing', async function () {
      const { getDatabase, ref, set, get } = databaseModular;

      const dbRef = ref(getDatabase(), `${TEST_PATH}/issue_100`);

      const data = {
        1: {
          someKey: 'someValue',
          someOtherKey: 'someOtherValue',
        },
        2: {
          someKey: 'someValue',
          someOtherKey: 'someOtherValue',
        },
        3: {
          someKey: 'someValue',
          someOtherKey: 'someOtherValue',
        },
      };

      await set(dbRef, data);
      const snapshot = await get(dbRef);

      snapshot.val().should.eql([null, data[1], data[2], data[3]]);
    });

    describe('#108 filters correctly by float values', function () {
      it('returns filtered results', async function () {
        const { getDatabase, ref, set, get, query, orderByChild, startAt, endAt } = databaseModular;

        const dbRef = ref(getDatabase(), `${TEST_PATH}/issue_108/filter`);

        const data = {
          foobar: {
            name: 'Foobar Pizzas',
            latitude: 34.1013717,
          },
          notTheFoobar: {
            name: "Not the pizza you're looking for",
            latitude: 34.456787,
          },
          notAFloat: {
            name: 'Not a float',
            latitude: 37,
          },
        };

        await set(dbRef, data);
        const snapshot = await get(
          query(
            dbRef,
            orderByChild('latitude'),
            startAt(34.00867000999119),
            endAt(34.17462960866099),
          ),
        );

        const val = snapshot.val();
        val.foobar.should.eql(data.foobar);

        should.equal(Object.keys(val).length, 1);
      });

      it('returns correct results when not using float values', async function () {
        const { getDatabase, ref, set, get, query, orderByChild, equalTo } = databaseModular;

        const dbRef = ref(getDatabase(), `${TEST_PATH}/issue_108/integer`);

        const data = {
          foobar: {
            name: 'Foobar Pizzas',
            latitude: 34.1013717,
          },
          notTheFoobar: {
            name: "Not the pizza you're looking for",
            latitude: 34.456787,
          },
          notAFloat: {
            name: 'Not a float',
            latitude: 37,
          },
        };

        await set(dbRef, data);
        const snapshot = await get(query(dbRef, orderByChild('latitude'), equalTo(37)));

        const val = snapshot.val();

        val.notAFloat.should.eql(data.notAFloat);

        should.equal(Object.keys(val).length, 1);
      });
    });

    it('#489 reutrns long numbers correctly', async function () {
      const { getDatabase, ref, set, get } = databaseModular;

      const LONG = 1508777379000;
      const dbRef = ref(getDatabase(), `${TEST_PATH}/issue_489`);
      await set(dbRef, LONG);
      const snapshot = await get(dbRef);
      snapshot.val().should.eql(LONG);
    });
  });
});
