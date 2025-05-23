/*
 *  Copyright (c) 2016-present Invertase Limited & Contributors
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this library except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */
const COLLECTION = 'firestore';

describe('FirestoreQuery/FirestoreQueryModifiers', function () {
  describe('v8 compatibility', function () {
    beforeEach(async function beforeEachTest() {
      // @ts-ignore
      globalThis.RNFB_SILENCE_MODULAR_DEPRECATION_WARNINGS = true;
    });

    afterEach(async function afterEachTest() {
      // @ts-ignore
      globalThis.RNFB_SILENCE_MODULAR_DEPRECATION_WARNINGS = false;
    });

    it('should not mutate previous queries (#2691)', async function () {
      const queryBefore = firebase.firestore().collection(COLLECTION).where('age', '>', 30);
      const queryAfter = queryBefore.orderBy('age');
      queryBefore._modifiers._orders.length.should.equal(0);
      queryBefore._modifiers._filters.length.should.equal(1);

      queryAfter._modifiers._orders.length.should.equal(1);
      queryAfter._modifiers._filters.length.should.equal(1);
    });

    it('throws if where equality operator is invoked, and the where fieldPath parameter matches any orderBy parameter', async function () {
      try {
        firebase
          .firestore()
          .collection(COLLECTION)
          .where('foo', '==', 'bar')
          .orderBy('foo')
          .limit(1)
          .endAt(2);
        return Promise.reject(new Error('Did not throw an Error.'));
      } catch (error) {
        error.message.should.containEql('Invalid query');
      }

      try {
        firebase
          .firestore()
          .collection(COLLECTION)
          .where('foo', '==', 'bar')
          .orderBy('bar')
          .orderBy('foo')
          .limit(1)
          .endAt(2);
        return Promise.reject(new Error('Did not throw an Error.'));
      } catch (error) {
        error.message.should.containEql('Invalid query');
      }
    });

    it('throws if where inequality operator is invoked, and the where fieldPath does not match initial orderBy parameter', async function () {
      try {
        firebase
          .firestore()
          .collection(COLLECTION)
          .where('foo', '>', 'bar')
          .orderBy('bar')
          .orderBy('foo')
          .limit(1)
          .endAt(2);
        return Promise.reject(new Error('Did not throw an Error.'));
      } catch (error) {
        error.message.should.containEql('Invalid query');
      }
    });
  });

  describe('modular', function () {
    it('should not mutate previous queries (#2691)', async function () {
      const { getFirestore, collection, query, where, orderBy } = firestoreModular;
      const queryBefore = query(collection(getFirestore(), COLLECTION), where('age', '>', 30));
      const queryAfter = query(queryBefore, orderBy('age'));
      queryBefore._modifiers._orders.length.should.equal(0);
      queryBefore._modifiers._filters.length.should.equal(1);

      queryAfter._modifiers._orders.length.should.equal(1);
      queryAfter._modifiers._filters.length.should.equal(1);
    });

    it('throws if where equality operator is invoked, and the where fieldPath parameter matches any orderBy parameter', async function () {
      const { getFirestore, collection, query, where, orderBy, limit, endAt } = firestoreModular;
      const db = getFirestore();
      try {
        query(
          collection(db, COLLECTION),
          where('foo', '==', 'bar'),
          orderBy('foo'),
          limit(1),
          endAt(2),
        );
        return Promise.reject(new Error('Did not throw an Error.'));
      } catch (error) {
        error.message.should.containEql('Invalid query');
      }

      try {
        query(
          collection(db, COLLECTION),
          where('foo', '==', 'bar'),
          orderBy('bar'),
          orderBy('foo'),
          limit(1),
          endAt(2),
        );
        return Promise.reject(new Error('Did not throw an Error.'));
      } catch (error) {
        error.message.should.containEql('Invalid query');
      }
    });

    it('throws if where inequality operator is invoked, and the where fieldPath does not match initial orderBy parameter', async function () {
      const { getFirestore, collection, query, where, orderBy, limit, endAt } = firestoreModular;
      try {
        query(
          collection(getFirestore(), COLLECTION),
          where('foo', '>', 'bar'),
          orderBy('bar'),
          orderBy('foo'),
          limit(1),
          endAt(2),
        );
        return Promise.reject(new Error('Did not throw an Error.'));
      } catch (error) {
        error.message.should.containEql('Invalid query');
      }
    });
  });
});
