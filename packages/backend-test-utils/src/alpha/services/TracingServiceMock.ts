/*
 * Copyright 2026 The Backstage Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {
  createServiceFactory,
  ServiceFactory,
} from '@backstage/backend-plugin-api';
import {
  TracingService,
  TracingServiceAttributeValue,
  TracingServiceBaggage,
  TracingServiceSpan,
  TracingServiceSpanStatus,
  tracingServiceRef,
} from '@backstage/backend-plugin-api/alpha';
import { tracingServiceFactory } from '@backstage/backend-defaults/alpha';

// Parses the `baggage` header per the W3C Baggage member syntax,
// dropping value properties (`;property=value`). This mirrors what
// `propagation.extract` does in the real tracing service, just enough
// for tests to assert end-to-end behaviour between propagated headers
// and `getActiveBaggage()`.
function parseBaggageHeader(
  headers: Record<string, string | string[] | undefined>,
): TracingServiceBaggage | undefined {
  let raw: string | undefined;
  for (const [name, value] of Object.entries(headers)) {
    if (name.toLowerCase() !== 'baggage') continue;
    raw = Array.isArray(value) ? value[0] : value;
    break;
  }
  if (!raw) return undefined;

  const entries = new Map<string, { value: string }>();
  for (const segment of raw.split(',')) {
    const [pair] = segment.split(';');
    const eqIdx = pair.indexOf('=');
    if (eqIdx === -1) continue;
    const key = decodeURIComponent(pair.slice(0, eqIdx).trim());
    const value = decodeURIComponent(pair.slice(eqIdx + 1).trim());
    if (!key) continue;
    entries.set(key, { value });
  }
  if (entries.size === 0) return undefined;

  return {
    getEntry: key => entries.get(key),
    getAllEntries: () => Array.from(entries.entries()),
  };
}

/**
 * A jest-mocked span captured by {@link TracingServiceMock}.
 *
 * @alpha
 */
export interface MockedTracingServiceSpan extends TracingServiceSpan {
  setAttribute: jest.Mock<void, [string, TracingServiceAttributeValue]>;
  setStatus: jest.Mock<void, [TracingServiceSpanStatus]>;
}

/**
 * Mock for the `TracingService`. Captures every span created via
 * `startActiveSpan` so tests can assert on the options passed in and the
 * methods called on the span inside the callback.
 *
 * By default, `withPropagatedContext` parses the `baggage` header (W3C
 * Baggage syntax) out of the supplied headers and makes those entries
 * available via `getActiveBaggage` for the duration of the wrapped
 * callback. Other propagation headers (e.g. `traceparent`) are ignored.
 * Tests that need fully custom baggage can still override
 * `getActiveBaggage` via `mockReturnValue` / `mockImplementation`, which
 * takes precedence over the default behaviour.
 *
 * @alpha
 */
export interface TracingServiceMock extends TracingService {
  startActiveSpan: jest.MockedFunction<TracingService['startActiveSpan']>;
  withPropagatedContext: jest.MockedFunction<
    TracingService['withPropagatedContext']
  >;
  getActiveBaggage: jest.MockedFunction<TracingService['getActiveBaggage']>;
  /** Spans created by `startActiveSpan` calls, in order. */
  spans: MockedTracingServiceSpan[];
  factory: ServiceFactory<TracingService>;
}

/**
 * @alpha
 */
export namespace tracingServiceMock {
  /**
   * Returns the real `tracingServiceFactory` from `@backstage/backend-defaults`,
   * for tests that want the full default implementation.
   */
  export const factory = () => tracingServiceFactory;

  /**
   * Builds a mock `TracingService` backed by jest mocks.
   */
  export const mock = (): TracingServiceMock => {
    const spans: MockedTracingServiceSpan[] = [];
    const startActiveSpan = jest.fn(async (_name, fn, _options) => {
      const span: MockedTracingServiceSpan = {
        setAttribute: jest.fn(),
        setStatus: jest.fn(),
      };
      spans.push(span);
      return await fn(span);
    }) as TracingServiceMock['startActiveSpan'];

    const baggageStack: Array<TracingServiceBaggage | undefined> = [];
    const withPropagatedContext = jest.fn(async (headers, fn) => {
      baggageStack.push(parseBaggageHeader(headers));
      try {
        return await fn();
      } finally {
        baggageStack.pop();
      }
    }) as TracingServiceMock['withPropagatedContext'];
    const getActiveBaggage = jest.fn(
      () => baggageStack[baggageStack.length - 1],
    ) as TracingServiceMock['getActiveBaggage'];

    const service: TracingService = {
      startActiveSpan,
      withPropagatedContext,
      getActiveBaggage,
    };

    return Object.assign(service as TracingServiceMock, {
      spans,
      factory: createServiceFactory({
        service: tracingServiceRef,
        deps: {},
        factory: () => service,
      }),
    });
  };
}
