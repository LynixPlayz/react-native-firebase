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
const COLLECTION = 'firestore';
const { wipe } = require('../helpers');
describe('firestore().collection().startAfter()', function () {
  before(function () {
    return wipe();
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

    it('throws if no argument provided', function () {
      try {
        firebase.firestore().collection(COLLECTION).startAfter();
        return Promise.reject(new Error('Did not throw an Error.'));
      } catch (error) {
        error.message.should.containEql(
          'Expected a DocumentSnapshot or list of field values but got undefined',
        );
        return Promise.resolve();
      }
    });

    it('throws if a inconsistent order number', function () {
      try {
        firebase.firestore().collection(COLLECTION).orderBy('foo').startAfter('bar', 'baz');
        return Promise.reject(new Error('Did not throw an Error.'));
      } catch (error) {
        error.message.should.containEql('The number of arguments must be less than or equal');
        return Promise.resolve();
      }
    });

    it('throws if providing snapshot and field values', async function () {
      try {
        const doc = await firebase.firestore().doc(`${COLLECTION}/foo`).get();
        firebase.firestore().collection(COLLECTION).startAfter(doc, 'baz');
        return Promise.reject(new Error('Did not throw an Error.'));
      } catch (error) {
        error.message.should.containEql('Expected DocumentSnapshot or list of field values');
        return Promise.resolve();
      }
    });

    it('throws if provided snapshot does not exist', async function () {
      try {
        const doc = await firebase.firestore().doc(`${COLLECTION}/idonotexist`).get();
        firebase.firestore().collection(COLLECTION).startAfter(doc);
        return Promise.reject(new Error('Did not throw an Error.'));
      } catch (error) {
        error.message.should.containEql("Can't use a DocumentSnapshot that doesn't exist");
        return Promise.resolve();
      }
    });

    it('throws if order used with snapshot but fields do not exist', async function () {
      try {
        const doc = firebase.firestore().doc(`${COLLECTION}/iexist`);
        await doc.set({ foo: { bar: 'baz' } });
        const snap = await doc.get();

        firebase.firestore().collection(COLLECTION).orderBy('foo.baz').startAfter(snap);
        return Promise.reject(new Error('Did not throw an Error.'));
      } catch (error) {
        error.message.should.containEql(
          'You are trying to start or end a query using a document for which the field',
        );
        return Promise.resolve();
      }
    });

    it('starts after field values', async function () {
      const colRef = firebase.firestore().collection(`${COLLECTION}/startAfter/collection`);
      const doc1 = colRef.doc('doc1');
      const doc2 = colRef.doc('doc2');
      const doc3 = colRef.doc('doc3');

      await Promise.all([
        doc1.set({ foo: 1, bar: { value: 1 } }),
        doc2.set({ foo: 2, bar: { value: 2 } }),
        doc3.set({ foo: 3, bar: { value: 3 } }),
      ]);

      const qs = await colRef.orderBy('bar.value', 'desc').startAfter(2).get();

      qs.docs.length.should.eql(1);
      qs.docs[0].id.should.eql('doc1');
    });

    it('starts after snapshot field values', async function () {
      const colRef = firebase.firestore().collection(`${COLLECTION}/startAfter/snapshotFields`);
      const doc1 = colRef.doc('doc1');
      const doc2 = colRef.doc('doc2');
      const doc3 = colRef.doc('doc3');

      await Promise.all([
        doc1.set({ foo: 1, bar: { value: 'a' } }),
        doc2.set({ foo: 2, bar: { value: 'b' } }),
        doc3.set({ foo: 3, bar: { value: 'c' } }),
      ]);

      const startAfter = await doc2.get();

      const qs = await colRef.orderBy('bar.value').startAfter(startAfter).get();

      qs.docs.length.should.eql(1);
      qs.docs[0].id.should.eql('doc3');
    });

    it('startAfter snapshot', async function () {
      const colRef = firebase.firestore().collection(`${COLLECTION}/endsAt/snapshot`);
      const doc1 = colRef.doc('doc1');
      const doc2 = colRef.doc('doc2');
      const doc3 = colRef.doc('doc3');

      await Promise.all([doc1.set({ foo: 1 }), doc2.set({ foo: 1 }), doc3.set({ foo: 1 })]);

      const startAfter = await doc2.get();

      const qs = await colRef.startAfter(startAfter).get();

      qs.docs.length.should.eql(1);
      qs.docs[0].id.should.eql('doc3');
    });

    it('runs startAfter & endBefore in the same query', async function () {
      const colRef = firebase.firestore().collection(`${COLLECTION}/startAfter/snapshot`);
      const doc1 = colRef.doc('doc1');
      const doc2 = colRef.doc('doc2');
      const doc3 = colRef.doc('doc3');

      await Promise.all([doc1.set({ age: 1 }), doc2.set({ age: 2 }), doc3.set({ age: 3 })]);

      const first = await doc1.get();
      const last = await doc3.get();

      const inBetween = await colRef.orderBy('age', 'asc').startAfter(first).endBefore(last).get();

      inBetween.docs.length.should.eql(1);
      inBetween.docs[0].id.should.eql('doc2');
    });
  });

  describe('modular', function () {
    it('throws if no argument provided', function () {
      const { getFirestore, collection, query, startAfter } = firestoreModular;
      try {
        query(collection(getFirestore(), COLLECTION), startAfter());
        return Promise.reject(new Error('Did not throw an Error.'));
      } catch (error) {
        error.message.should.containEql(
          'Expected a DocumentSnapshot or list of field values but got undefined',
        );
        return Promise.resolve();
      }
    });

    it('throws if a inconsistent order number', function () {
      const { getFirestore, collection, query, orderBy, startAfter } = firestoreModular;
      try {
        query(collection(getFirestore(), COLLECTION), orderBy('foo'), startAfter('bar', 'baz'));
        return Promise.reject(new Error('Did not throw an Error.'));
      } catch (error) {
        error.message.should.containEql('The number of arguments must be less than or equal');
        return Promise.resolve();
      }
    });

    it('throws if providing snapshot and field values', async function () {
      const { getFirestore, collection, doc, getDoc, query, startAfter } = firestoreModular;
      const db = getFirestore();
      try {
        const docRef = await getDoc(doc(db, `${COLLECTION}/foo`));
        query(collection(db, COLLECTION), startAfter(docRef, 'baz'));
        return Promise.reject(new Error('Did not throw an Error.'));
      } catch (error) {
        error.message.should.containEql('Expected DocumentSnapshot or list of field values');
        return Promise.resolve();
      }
    });

    it('throws if provided snapshot does not exist', async function () {
      const { getFirestore, collection, doc, getDoc, query, startAfter } = firestoreModular;
      const db = getFirestore();
      try {
        const docRef = await getDoc(doc(db, `${COLLECTION}/idonotexist`));
        query(collection(db, COLLECTION), startAfter(docRef));
        return Promise.reject(new Error('Did not throw an Error.'));
      } catch (error) {
        error.message.should.containEql("Can't use a DocumentSnapshot that doesn't exist");
        return Promise.resolve();
      }
    });

    it('throws if order used with snapshot but fields do not exist', async function () {
      const { getFirestore, collection, doc, setDoc, getDoc, query, orderBy, startAfter } =
        firestoreModular;
      const db = getFirestore();
      try {
        const docRef = doc(db, `${COLLECTION}/iexist`);
        await setDoc(docRef, { foo: { bar: 'baz' } });
        const snap = await getDoc(docRef);

        query(collection(db, COLLECTION), orderBy('foo.baz'), startAfter(snap));
        return Promise.reject(new Error('Did not throw an Error.'));
      } catch (error) {
        error.message.should.containEql(
          'You are trying to start or end a query using a document for which the field',
        );
        return Promise.resolve();
      }
    });

    it('starts after field values', async function () {
      const { getFirestore, collection, doc, setDoc, query, orderBy, startAfter, getDocs } =
        firestoreModular;
      const db = getFirestore();
      const colRef = collection(db, `${COLLECTION}/startAfter/collection`);
      const doc1 = doc(colRef, 'doc1');
      const doc2 = doc(colRef, 'doc2');
      const doc3 = doc(colRef, 'doc3');

      await Promise.all([
        setDoc(doc1, { foo: 1, bar: { value: 1 } }),
        setDoc(doc2, { foo: 2, bar: { value: 2 } }),
        setDoc(doc3, { foo: 3, bar: { value: 3 } }),
      ]);

      const qs = await getDocs(query(colRef, orderBy('bar.value', 'desc'), startAfter(2)));

      qs.docs.length.should.eql(1);
      qs.docs[0].id.should.eql('doc1');
    });

    it('starts after snapshot field values', async function () {
      const { getFirestore, collection, doc, setDoc, query, startAfter, getDocs, getDoc, orderBy } =
        firestoreModular;
      const colRef = collection(getFirestore(), `${COLLECTION}/startAfter/snapshotFields`);
      const doc1 = doc(colRef, 'doc1');
      const doc2 = doc(colRef, 'doc2');
      const doc3 = doc(colRef, 'doc3');

      await Promise.all([
        setDoc(doc1, { foo: 1, bar: { value: 'a' } }),
        setDoc(doc2, { foo: 2, bar: { value: 'b' } }),
        setDoc(doc3, { foo: 3, bar: { value: 'c' } }),
      ]);

      const startAfterSnapshot = await getDoc(doc2);

      const qs = await getDocs(query(colRef, orderBy('bar.value'), startAfter(startAfterSnapshot)));

      qs.docs.length.should.eql(1);
      qs.docs[0].id.should.eql('doc3');
    });

    it('startAfter snapshot', async function () {
      const { getFirestore, collection, doc, setDoc, query, startAfter, getDocs, getDoc } =
        firestoreModular;
      const colRef = collection(getFirestore(), `${COLLECTION}/endsAt/snapshot`);
      const doc1 = doc(colRef, 'doc1');
      const doc2 = doc(colRef, 'doc2');
      const doc3 = doc(colRef, 'doc3');

      await Promise.all([
        setDoc(doc1, { foo: 1 }),
        setDoc(doc2, { foo: 1 }),
        setDoc(doc3, { foo: 1 }),
      ]);

      const startAfterSnapshot = await getDoc(doc2);

      const qs = await getDocs(query(colRef, startAfter(startAfterSnapshot)));

      qs.docs.length.should.eql(1);
      qs.docs[0].id.should.eql('doc3');
    });

    it('runs startAfter & endBefore in the same query', async function () {
      const {
        getFirestore,
        collection,
        doc,
        setDoc,
        getDocs,
        getDoc,
        query,
        orderBy,
        startAfter,
        endBefore,
      } = firestoreModular;
      const colRef = collection(getFirestore(), `${COLLECTION}/startAfter/snapshot`);
      const doc1 = doc(colRef, 'doc1');
      const doc2 = doc(colRef, 'doc2');
      const doc3 = doc(colRef, 'doc3');

      await Promise.all([
        setDoc(doc1, { age: 1 }),
        setDoc(doc2, { age: 2 }),
        setDoc(doc3, { age: 3 }),
      ]);

      const first = await getDoc(doc1);
      const last = await getDoc(doc3);

      const inBetween = await getDocs(
        query(colRef, orderBy('age', 'asc'), startAfter(first), endBefore(last)),
      );

      inBetween.docs.length.should.eql(1);
      inBetween.docs[0].id.should.eql('doc2');
    });
  });
});
