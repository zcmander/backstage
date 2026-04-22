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

import { InputError } from '@backstage/errors';
import {
  DefaultGithubCredentialsProvider,
  GithubCredentialsProvider,
  ScmIntegrationRegistry,
} from '@backstage/integration';
import { parseRepoUrl } from '@backstage/plugin-scaffolder-node';
import { OctokitOptions } from '@octokit/core/dist-types/types';
import { Octokit } from 'octokit';
import { retry } from '@octokit/plugin-retry';
import { LoggerService } from '@backstage/backend-plugin-api';

const DEFAULT_TIMEOUT_MS = 60_000;

// By default, octokit/plugin-retry will retry 3 times with a 1 second delay
// between retries.
const DEFAULT_RETRY_ATTEMPTS = 3;
const DEFAULT_RETRY_DELAY_MS = 1000;

/**
 * Helper function to determine if retries are enabled based on the provided
 * options.
 *
 * Retries are enabled by default, but can be disabled by setting either `retries`
 * or `retryDelay` to 0.
 *
 * @param retries - The number of retry attempts for failed requests. Default is 3.
 * Setting to 0 will disable retries.
 * @param retryDelay - The delay in milliseconds between retry attempts.
 * Default is 1000ms. Setting to 0 will disable retries.
 *
 * @returns A boolean indicating whether retries are enabled or not.
 */
export function isRetryEnabled(retries?: number, retryDelay?: number): boolean {
  if (retries === 0) {
    return false;
  }

  if (retryDelay === 0) {
    return false;
  }

  return true;
}

/**
 * Helper for generating an authenticated Octokit client with (or without)
 * retry capabilities.
 *
 * If retries are enabled (default), the client will retry failed requests up
 * to the specified number of retries and delay.
 * To disable retries, set either `retries` or `retryDelay` to 0 in the options.
 *
 * @param octokitOptions - The options for configuring the Octokit client.
 * Generally provided by the `getOctokitOptions` helper.
 * @param logger - LoggerService instance for logging retry attempts and
 * failures.
 * @param retries - The number of retry attempts for failed requests.
 * Default is 3. Setting to 0 will disable retries.
 * @param retryDelay - The delay in milliseconds between retry attempts.
 * Default is 1000ms. Setting to 0 will disable retries.
 * @returns An authenticated Octokit client instance based on the provided
 * options.
 */
export function getOctokitClient(
  octokitOptions: OctokitOptions,
  logger: LoggerService,
  retries: number = DEFAULT_RETRY_ATTEMPTS,
  retryDelay: number = DEFAULT_RETRY_DELAY_MS,
): Octokit {
  // Default behavior is to enable retries, but allow callers to disable by
  // explicitly setting retries or retryDelay to 0
  if (!isRetryEnabled(retries, retryDelay)) {
    return new Octokit({
      ...octokitOptions,
      log: logger,
    });
  }

  // Update the octokit options to include retry configuration with logging
  const MyOctokit = Octokit.plugin(retry);
  return new MyOctokit({
    ...octokitOptions,
    request: {
      ...octokitOptions.request,
      retries,
      retryAfter: retryDelay,
    },
    log: logger,
  });
}

/**
 * Helper for generating octokit configuration options.
 * If no token is provided, it will attempt to get a token from the credentials provider.
 * @public
 */
export async function getOctokitOptions(options: {
  integrations: ScmIntegrationRegistry;
  credentialsProvider?: GithubCredentialsProvider;
  token?: string;
  host: string;
  owner?: string;
  repo?: string;
}): Promise<OctokitOptions>;

/**
 * Helper for generating octokit configuration options for given repoUrl.
 * If no token is provided, it will attempt to get a token from the credentials provider.
 * @public
 * @deprecated Use options `host`, `owner` and `repo` instead of `repoUrl`.
 */
export async function getOctokitOptions(options: {
  integrations: ScmIntegrationRegistry;
  credentialsProvider?: GithubCredentialsProvider;
  token?: string;
  repoUrl: string;
}): Promise<OctokitOptions>;

export async function getOctokitOptions(options: {
  integrations: ScmIntegrationRegistry;
  credentialsProvider?: GithubCredentialsProvider;
  token?: string;
  host?: string;
  owner?: string;
  repo?: string;
  repoUrl?: string;
}): Promise<OctokitOptions> {
  const { integrations, credentialsProvider, token, repoUrl } = options;
  const { host, owner, repo } = repoUrl
    ? parseRepoUrl(repoUrl, integrations)
    : options;

  const requestOptions = {
    // set timeout to 60 seconds
    timeout: DEFAULT_TIMEOUT_MS,
  };

  const integrationConfig = integrations.github.byHost(host!)?.config;

  if (!integrationConfig) {
    throw new InputError(`No integration for host ${host}`);
  }

  // short circuit the `githubCredentialsProvider` if there is a token provided by the caller already
  if (token) {
    return {
      auth: token,
      baseUrl: integrationConfig.apiBaseUrl,
      previews: ['nebula-preview'],
      request: requestOptions,
    };
  }

  if (!owner || !repo) {
    throw new InputError(
      `No owner and/or repo provided, which is required if a token is not provided`,
    );
  }

  const githubCredentialsProvider =
    credentialsProvider ??
    DefaultGithubCredentialsProvider.fromIntegrations(integrations);

  const { token: credentialProviderToken } =
    await githubCredentialsProvider.getCredentials({
      url: `https://${host}/${encodeURIComponent(owner)}/${encodeURIComponent(
        repo,
      )}`,
    });

  if (!credentialProviderToken) {
    throw new InputError(
      `No token available for host: ${host}, with owner ${owner}, and repo ${repo}. Make sure GitHub auth is configured correctly. See https://backstage.io/docs/auth/github/provider for more details.`,
    );
  }

  return {
    auth: credentialProviderToken,
    baseUrl: integrationConfig.apiBaseUrl,
    previews: ['nebula-preview'],
  };
}
