import { afterAll, beforeAll, describe, expect, it, beforeEach, jest } from '@jest/globals';

import perf, {
  firebase,
  getPerformance,
  initializePerformance,
  trace,
  httpMetric,
  newScreenTrace,
  startScreenTrace,
} from '../lib';

import {
  createCheckV9Deprecation,
  CheckV9DeprecationFunction,
} from '../../app/lib/common/unitTestUtils';

// @ts-ignore test
import FirebaseModule from '../../app/lib/internal/FirebaseModule';

describe('Performance Monitoring', function () {
  describe('namespace', function () {
    beforeAll(async function () {
      // @ts-ignore
      globalThis.RNFB_SILENCE_MODULAR_DEPRECATION_WARNINGS = true;
    });

    afterAll(async function () {
      // @ts-ignore
      globalThis.RNFB_SILENCE_MODULAR_DEPRECATION_WARNINGS = false;
    });

    it('accessible from firebase.app()', function () {
      const app = firebase.app();
      expect(app.perf).toBeDefined();
      expect(app.perf().app).toEqual(app);
    });

    describe('setPerformanceCollectionEnabled', function () {
      it('errors if not boolean', function () {
        expect(async () => {
          // @ts-ignore
          await perf().setPerformanceCollectionEnabled();
        }).rejects.toThrow('must be a boolean');
      });
    });

    describe('newTrace()', function () {
      it('returns an instance of Trace', function () {
        const trace = perf().newTrace('invertase');
        expect(trace.constructor.name).toEqual('Trace');

        // @ts-ignore
        expect(trace._identifier).toEqual('invertase');
      });

      it('errors if identifier not a string', function () {
        try {
          // @ts-ignore
          perf().newTrace(1337);
          return Promise.reject(new Error('Did not throw'));
        } catch (e: any) {
          expect(e.message).toEqual(
            "firebase.perf().newTrace(*) 'identifier' must be a string with a maximum length of 100 characters.",
          );
          return Promise.resolve();
        }
      });

      it('errors if identifier length > 100', function () {
        try {
          perf().newTrace(new Array(101).fill('i').join(''));
          return Promise.reject(new Error('Did not throw'));
        } catch (e: any) {
          expect(e.message).toEqual(
            "firebase.perf().newTrace(*) 'identifier' must be a string with a maximum length of 100 characters.",
          );
          return Promise.resolve();
        }
      });
    });

    describe('newHttpMetric()', function () {
      it('returns an instance of HttpMetric', async function () {
        const metric = perf().newHttpMetric('https://invertase.io', 'GET');
        expect(metric.constructor.name).toEqual('HttpMetric');

        // @ts-ignore
        expect(metric._url).toEqual('https://invertase.io');

        // @ts-ignore
        expect(metric._httpMethod).toEqual('GET');
      });

      it('errors if url not a string', async function () {
        try {
          // @ts-ignore
          perf().newHttpMetric(1337, 7331);
          return Promise.reject(new Error('Did not throw'));
        } catch (e: any) {
          expect(e.message).toEqual("firebase.perf().newHttpMetric(*, _) 'url' must be a string.");
          return Promise.resolve();
        }
      });

      it('errors if httpMethod not a string', async function () {
        try {
          // @ts-ignore
          perf().newHttpMetric('https://invertase.io', 1337);
          return Promise.reject(new Error('Did not throw'));
        } catch (e: any) {
          expect(e.message).toEqual(
            "firebase.perf().newHttpMetric(_, *) 'httpMethod' must be one of CONNECT, DELETE, GET, HEAD, OPTIONS, PATCH, POST, PUT, TRACE.",
          );
          return Promise.resolve();
        }
      });

      it('errors if httpMethod not a valid type', async function () {
        try {
          // @ts-ignore
          perf().newHttpMetric('https://invertase.io', 'FIRE');
          return Promise.reject(new Error('Did not throw'));
        } catch (e: any) {
          expect(e.message).toEqual(
            "firebase.perf().newHttpMetric(_, *) 'httpMethod' must be one of CONNECT, DELETE, GET, HEAD, OPTIONS, PATCH, POST, PUT, TRACE.",
          );
          return Promise.resolve();
        }
      });
    });

    describe('setPerformanceCollectionEnabled()', function () {
      it('errors if not boolean', async function () {
        try {
          // @ts-ignore
          await firebase.perf().setPerformanceCollectionEnabled();
          return Promise.reject(new Error('Did not throw'));
        } catch (e: any) {
          expect(e.message).toEqual(
            "firebase.perf().setPerformanceCollectionEnabled(*) 'enabled' must be a boolean.",
          );
          return Promise.resolve();
        }
      });
    });
  });

  describe('modular', function () {
    it('`getPerformance` function is properly exposed to end user', function () {
      expect(getPerformance).toBeDefined();
    });

    it('`initializePerformance` function is properly exposed to end user', function () {
      expect(initializePerformance).toBeDefined();
    });

    it('`trace` function is properly exposed to end user', function () {
      expect(trace).toBeDefined();
    });

    it('`httpMetric` function is properly exposed to end user', function () {
      expect(httpMetric).toBeDefined();
    });

    it('`newScreenTrace` function is properly exposed to end user', function () {
      expect(newScreenTrace).toBeDefined();
    });

    it('`startScreenTrace` function is properly exposed to end user', function () {
      expect(startScreenTrace).toBeDefined();
    });
  });

  describe('test `console.warn` is called for RNFB v8 API & not called for v9 API', function () {
    let perfV9Deprecation: CheckV9DeprecationFunction;

    beforeEach(function () {
      perfV9Deprecation = createCheckV9Deprecation(['perf']);

      // @ts-ignore test
      jest.spyOn(FirebaseModule.prototype, 'native', 'get').mockImplementation(() => {
        return new Proxy(
          {},
          {
            get: () =>
              jest.fn().mockResolvedValue({
                result: true,
                constants: {
                  isPerformanceCollectionEnabled: true,
                  isInstrumentationEnabled: true,
                },
              } as never),
          },
        );
      });
    });

    it('newTrace()', function () {
      const perf = getPerformance();
      perfV9Deprecation(
        () => trace(perf, 'invertase'),
        () => perf.newTrace('invertase'),
        'newTrace',
      );
    });

    it('newHttpMetric()', function () {
      const perf = getPerformance();
      perfV9Deprecation(
        () => httpMetric(perf, 'https://invertase.io', 'GET'),
        () => perf.newHttpMetric('https://invertase.io', 'GET'),
        'newHttpMetric',
      );
    });

    it('newScreenTrace()', function () {
      const perf = getPerformance();
      perfV9Deprecation(
        () => newScreenTrace(perf, 'invertase'),
        () => perf.newScreenTrace('invertase'),
        'newScreenTrace',
      );
    });

    it('startScreenTrace()', function () {
      const perf = getPerformance();
      perfV9Deprecation(
        () => startScreenTrace(perf, 'invertase'),
        () => perf.startScreenTrace('invertase'),
        'startScreenTrace',
      );
    });
  });
});
