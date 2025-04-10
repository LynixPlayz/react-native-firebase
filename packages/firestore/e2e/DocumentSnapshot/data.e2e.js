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
const { wipe } = require('../helpers');
const COLLECTION = 'firestore';

// { hello: 'world' };
const blobBase64 = 'eyJoZWxsbyI6IndvcmxkIn0=';

describe('firestore().doc() -> snapshot.data()', function () {
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

    it('returns undefined if document does not exist', async function () {
      const ref = firebase.firestore().doc(`${COLLECTION}/idonotexist`);
      const snapshot = await ref.get();
      should.equal(snapshot.data(), undefined);
    });

    it('returns an object if exists', async function () {
      const ref = firebase.firestore().doc(`${COLLECTION}/getData`);
      const data = { foo: 'bar' };
      await ref.set(data);
      const snapshot = await ref.get();
      snapshot.data().should.eql(jet.contextify(data));
      await ref.delete();
    });

    it('returns an object when document is empty', async function () {
      const ref = firebase.firestore().doc(`${COLLECTION}/getData`);
      const data = {};
      await ref.set(data);
      const snapshot = await ref.get();
      snapshot.data().should.eql(jet.contextify(data));
      await ref.delete();
    });

    // it('handles SnapshotOptions', function () {
    //   // TODO
    // });

    it('handles all data types', async function () {
      const types = {
        string: '123456',
        stringEmpty: '',
        number: 123456,
        infinity: Infinity,
        minusInfinity: -Infinity,
        nan: 1 + undefined,
        boolTrue: true,
        boolFalse: false,
        map: {}, // set after
        array: [], // set after,
        nullValue: null,
        timestamp: new firebase.firestore.Timestamp(123, 123456),
        date: new Date(),
        geopoint: new firebase.firestore.GeoPoint(1, 2),
        reference: firebase.firestore().doc(`${COLLECTION}/foobar`),
        blob: firebase.firestore.Blob.fromBase64String(blobBase64),
      };

      const map = { foo: 'bar' };
      const array = [123, '456', null];
      types.map = map;
      types.array = array;

      const ref = firebase.firestore().doc(`${COLLECTION}/types`);
      await ref.set(types);
      const snapshot = await ref.get();
      const data = snapshot.data();

      // String
      data.string.should.be.a.String();
      data.string.should.equal(types.string);
      data.stringEmpty.should.be.a.String();
      data.stringEmpty.should.equal(types.stringEmpty);

      // Number
      data.number.should.be.a.Number();
      data.number.should.equal(types.number);
      data.infinity.should.be.Infinity();
      should.equal(data.infinity, Number.POSITIVE_INFINITY);
      data.minusInfinity.should.be.Infinity();
      should.equal(data.minusInfinity, Number.NEGATIVE_INFINITY);
      data.nan.should.be.eql(NaN);

      // Boolean
      data.boolTrue.should.be.a.Boolean();
      data.boolTrue.should.be.true();
      data.boolFalse.should.be.a.Boolean();
      data.boolFalse.should.be.false();

      // Map
      data.map.should.be.an.Object();
      data.map.should.eql(jet.contextify(map));

      // Array
      data.array.should.be.an.Array();
      data.array.should.eql(jet.contextify(array));

      // Null
      should.equal(data.nullValue, null);

      // Timestamp
      data.timestamp.should.be.an.instanceOf(firebase.firestore.Timestamp);
      data.timestamp.seconds.should.be.a.Number();
      data.timestamp.nanoseconds.should.be.a.Number();
      data.date.should.be.an.instanceOf(firebase.firestore.Timestamp);
      data.date.seconds.should.be.a.Number();
      data.date.nanoseconds.should.be.a.Number();

      // GeoPoint
      data.geopoint.should.be.an.instanceOf(firebase.firestore.GeoPoint);
      data.geopoint.latitude.should.be.a.Number();
      data.geopoint.longitude.should.be.a.Number();

      // Reference
      // data.reference.should.be.an.instanceOf();
      data.reference.path.should.equal(`${COLLECTION}/foobar`);

      // Blob
      data.blob.toBase64.should.be.a.Function();

      await ref.delete();
    });
  });

  describe('modular', function () {
    it('returns undefined if documet does not exist', async function () {
      const { getFirestore, doc, getDoc } = firestoreModular;
      const ref = doc(getFirestore(), `${COLLECTION}/idonotexist`);
      const snapshot = await getDoc(ref);
      should.equal(snapshot.data(), undefined);
    });

    it('returns an object if exists', async function () {
      const { getFirestore, doc, setDoc, getDoc, deleteDoc } = firestoreModular;
      const ref = doc(getFirestore(), `${COLLECTION}/getData`);
      const data = { foo: 'bar' };
      await setDoc(ref, data);
      const snapshot = await getDoc(ref);
      snapshot.data().should.eql(jet.contextify(data));
      await deleteDoc(ref);
    });

    it('returns an object when document is empty', async function () {
      const { getFirestore, doc, setDoc, getDoc, deleteDoc } = firestoreModular;
      const ref = doc(getFirestore(), `${COLLECTION}/getData`);
      const data = {};
      await setDoc(ref, data);
      const snapshot = await getDoc(ref);
      snapshot.data().should.eql(jet.contextify(data));
      await deleteDoc(ref);
    });

    // it('handles SnapshotOptions', function () {
    //   // TODO
    // });

    it('handles all data types', async function () {
      const { getFirestore, doc, setDoc, getDoc, deleteDoc, Timestamp, Bytes, GeoPoint } =
        firestoreModular;
      const types = {
        string: '123456',
        stringEmpty: '',
        number: 123456,
        infinity: Infinity,
        minusInfinity: -Infinity,
        nan: 1 + undefined,
        boolTrue: true,
        boolFalse: false,
        map: {}, // set after
        array: [], // set after,
        nullValue: null,
        timestamp: new Timestamp(123, 123456),
        date: new Date(),
        geopoint: new GeoPoint(1, 2),
        reference: doc(getFirestore(), `${COLLECTION}/foobar`),
        bytes: Bytes.fromBase64String(blobBase64),
      };

      const map = { foo: 'bar' };
      const array = [123, '456', null];
      types.map = map;
      types.array = array;

      const ref = doc(getFirestore(), `${COLLECTION}/types`);
      await setDoc(ref, types);
      const snapshot = await getDoc(ref);
      const data = snapshot.data();

      // String
      data.string.should.be.a.String();
      data.string.should.equal(types.string);
      data.stringEmpty.should.be.a.String();
      data.stringEmpty.should.equal(types.stringEmpty);

      // Number
      data.number.should.be.a.Number();
      data.number.should.equal(types.number);
      data.infinity.should.be.Infinity();
      should.equal(data.infinity, Number.POSITIVE_INFINITY);
      data.minusInfinity.should.be.Infinity();
      should.equal(data.minusInfinity, Number.NEGATIVE_INFINITY);
      data.nan.should.be.eql(NaN);

      // Boolean
      data.boolTrue.should.be.a.Boolean();
      data.boolTrue.should.be.true();
      data.boolFalse.should.be.a.Boolean();
      data.boolFalse.should.be.false();

      // Map
      data.map.should.be.an.Object();
      data.map.should.eql(jet.contextify(map));

      // Array
      data.array.should.be.an.Array();
      data.array.should.eql(jet.contextify(array));

      // Null
      should.equal(data.nullValue, null);

      // Timestamp
      data.timestamp.should.be.an.instanceOf(Timestamp);
      data.timestamp.seconds.should.be.a.Number();
      data.timestamp.nanoseconds.should.be.a.Number();
      data.date.should.be.an.instanceOf(Timestamp);
      data.date.seconds.should.be.a.Number();
      data.date.nanoseconds.should.be.a.Number();

      // GeoPoint
      data.geopoint.should.be.an.instanceOf(GeoPoint);
      data.geopoint.latitude.should.be.a.Number();
      data.geopoint.longitude.should.be.a.Number();

      // Reference
      // data.reference.should.be.an.instanceOf();
      data.reference.path.should.equal(`${COLLECTION}/foobar`);

      // Bytes
      data.bytes.should.be.an.instanceOf(Bytes);
      types.bytes.isEqual(data.bytes);
      data.bytes.isEqual(types.bytes);
      data.bytes.toBase64.should.be.a.Function();

      await deleteDoc(ref);
    });
  });
});
