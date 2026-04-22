/*
 * Copyright 2025 The Backstage Authors
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

import { Octokit } from 'octokit';
import { retry } from '@octokit/plugin-retry';
import { mockServices } from '@backstage/backend-test-utils';
import { isRetryEnabled, getOctokitClient } from './util';

jest.mock('octokit', () => ({
  Octokit: Object.assign(jest.fn(), {
    plugin: jest.fn(),
  }),
}));

jest.mock('@octokit/plugin-retry', () => ({
  retry: jest.fn(),
}));

const mockOctokitInstance = { request: jest.fn() };
const MockOctokit = Octokit as unknown as jest.MockedClass<typeof Octokit> & {
  plugin: jest.Mock;
};

describe('isRetryEnabled', () => {
  it('returns true when both params are undefined', () => {
    expect(isRetryEnabled()).toBe(true);
  });

  it('returns true when retries is positive and retryDelay is undefined', () => {
    expect(isRetryEnabled(3)).toBe(true);
  });

  it('returns true when retries is undefined and retryDelay is positive', () => {
    expect(isRetryEnabled(undefined, 1000)).toBe(true);
  });

  it('returns true when both retries and retryDelay are positive', () => {
    expect(isRetryEnabled(5, 2000)).toBe(true);
  });

  it('returns false when retries is 0', () => {
    expect(isRetryEnabled(0)).toBe(false);
  });

  it('returns false when retryDelay is 0', () => {
    expect(isRetryEnabled(undefined, 0)).toBe(false);
  });

  it('returns false when retries is 0 even if retryDelay is positive', () => {
    expect(isRetryEnabled(0, 1000)).toBe(false);
  });

  it('returns false when retryDelay is 0 even if retries is positive', () => {
    expect(isRetryEnabled(3, 0)).toBe(false);
  });
});

describe('getOctokitClient', () => {
  const logger = mockServices.logger.mock();
  const octokitOptions = {
    auth: 'test-token',
    baseUrl: 'https://api.github.com',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    MockOctokit.mockReturnValue(mockOctokitInstance as any);
    MockOctokit.plugin.mockReturnValue(MockOctokit);
  });

  it('returns a plain Octokit client when retries is 0', () => {
    const client = getOctokitClient(octokitOptions, logger, 0);

    expect(MockOctokit.plugin).not.toHaveBeenCalled();
    expect(MockOctokit).toHaveBeenCalledWith({
      ...octokitOptions,
      log: logger,
    });
    expect(client).toBe(mockOctokitInstance);
  });

  it('returns a plain Octokit client when retryDelay is 0', () => {
    const client = getOctokitClient(octokitOptions, logger, 3, 0);

    expect(MockOctokit.plugin).not.toHaveBeenCalled();
    expect(MockOctokit).toHaveBeenCalledWith({
      ...octokitOptions,
      log: logger,
    });
    expect(client).toBe(mockOctokitInstance);
  });

  it('returns a retry-enabled Octokit client with default retries and delay', () => {
    const client = getOctokitClient(octokitOptions, logger);

    expect(MockOctokit.plugin).toHaveBeenCalledWith(retry);
    expect(MockOctokit).toHaveBeenCalledWith({
      ...octokitOptions,
      request: {
        retries: 3,
        retryAfter: 1000,
      },
      log: logger,
    });
    expect(client).toBe(mockOctokitInstance);
  });

  it('returns a retry-enabled Octokit client with custom retries and delay', () => {
    const client = getOctokitClient(octokitOptions, logger, 5, 2000);

    expect(MockOctokit.plugin).toHaveBeenCalledWith(retry);
    expect(MockOctokit).toHaveBeenCalledWith({
      ...octokitOptions,
      request: {
        retries: 5,
        retryAfter: 2000,
      },
      log: logger,
    });
    expect(client).toBe(mockOctokitInstance);
  });

  it('merges existing request options when building retry client', () => {
    const optionsWithRequest = {
      ...octokitOptions,
      request: { timeout: 60_000 },
    };

    getOctokitClient(optionsWithRequest, logger, 3, 1000);

    expect(MockOctokit).toHaveBeenCalledWith({
      ...optionsWithRequest,
      request: {
        timeout: 60_000,
        retries: 3,
        retryAfter: 1000,
      },
      log: logger,
    });
  });
});
