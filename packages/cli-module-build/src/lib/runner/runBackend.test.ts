/*
 * Copyright 2020 The Backstage Authors
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

import { mockServices } from '@backstage/backend-test-utils';
import { ConfigSources } from '@backstage/config-loader';
import { runBackend } from './runBackend';
import spawn from 'cross-spawn';

// Mock external dependencies
jest.mock('chokidar', () => ({
  watch: jest.fn(() => ({
    on: jest.fn().mockReturnThis(),
    add: jest.fn(),
  })),
}));

jest.mock('cross-spawn', () =>
  jest.fn(() => ({
    on: jest.fn().mockReturnThis(),
    once: jest.fn().mockReturnThis(),
    kill: jest.fn(),
    killed: false,
    exitCode: null,
    pid: 12345,
  })),
);

jest.mock('../ipc', () => ({
  IpcServer: jest.fn().mockImplementation(() => ({
    addChild: jest.fn(),
  })),
  ServerDataStore: {
    bind: jest.fn(),
  },
}));

jest.mock('ctrlc-windows', () => ({
  ctrlc: jest.fn(),
}));

const mockConfigSourcesDefault = jest.fn().mockReturnValue({});

jest.mock('@backstage/config-loader', () => ({
  ConfigSources: {
    default: (...args: any[]) => mockConfigSourcesDefault(...args),
    toConfig: jest.fn(),
  },
}));

const mockStartEmbeddedDb = jest.fn();

jest.mock('./startEmbeddedDb', () => ({
  startEmbeddedDb: (...args: any[]) => mockStartEmbeddedDb(...args),
}));

describe('runBackend', () => {
  let originalEnv: NodeJS.ProcessEnv;
  let originalPlatform: string;
  const mockSpawn = spawn as jest.MockedFunction<typeof spawn>;
  const mockToConfig = ConfigSources.toConfig as jest.MockedFunction<
    typeof ConfigSources.toConfig
  >;

  function mockConfig(
    overrides?: Parameters<typeof mockServices.rootConfig.mock>[0],
  ) {
    const config = mockServices.rootConfig.mock(overrides);
    mockToConfig.mockResolvedValue(Object.assign(config, { close: jest.fn() }));
    return config;
  }

  beforeEach(() => {
    // Use fake timers to control debounce
    jest.useFakeTimers();

    // Save original environment
    originalEnv = { ...process.env };
    process.env = { NODE_ENV: 'test' };
    originalPlatform = process.platform;

    // Mock process.stdin.on to prevent actual stdin reading
    jest.spyOn(process.stdin, 'on').mockReturnValue(process.stdin);

    // Mock process.once to prevent actual signal handling
    jest.spyOn(process, 'once').mockReturnValue(process);

    mockConfig();
    mockStartEmbeddedDb.mockReset();
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
    Object.defineProperty(process, 'platform', {
      value: originalPlatform,
    });

    jest.clearAllMocks();
    jest.useRealTimers();
  });

  describe('--no-node-snapshot argument handling', () => {
    it('should pass --no-node-snapshot when NODE_OPTIONS is not set', async () => {
      delete process.env.NODE_OPTIONS;

      runBackend({ entry: 'src/index' });

      await jest.advanceTimersByTimeAsync(100);

      expect(mockSpawn).toHaveBeenCalled();
      const spawnArgs = mockSpawn.mock.calls[0][1] as string[];
      expect(spawnArgs).toContain('--no-node-snapshot');
    });

    it('should pass --no-node-snapshot when NODE_OPTIONS exists without --node-snapshot', async () => {
      process.env.NODE_OPTIONS = '--max-old-space-size=4096';

      runBackend({ entry: 'src/index' });

      await jest.advanceTimersByTimeAsync(100);

      expect(mockSpawn).toHaveBeenCalled();
      const spawnArgs = mockSpawn.mock.calls[0][1] as string[];
      expect(spawnArgs).toContain('--no-node-snapshot');
    });

    it('should not pass --no-node-snapshot when --node-snapshot already exists in NODE_OPTIONS', async () => {
      process.env.NODE_OPTIONS = '--node-snapshot --max-old-space-size=4096';

      runBackend({ entry: 'src/index' });

      await jest.advanceTimersByTimeAsync(100);

      expect(mockSpawn).toHaveBeenCalled();
      const spawnArgs = mockSpawn.mock.calls[0][1] as string[];
      expect(spawnArgs).not.toContain('--no-node-snapshot');
    });

    it('should not pass --no-node-snapshot when --node-snapshot exists in the middle of NODE_OPTIONS', async () => {
      process.env.NODE_OPTIONS =
        '--max-old-space-size=4096 --node-snapshot --inspect';

      runBackend({ entry: 'src/index' });

      await jest.advanceTimersByTimeAsync(100);

      expect(mockSpawn).toHaveBeenCalled();
      const spawnArgs = mockSpawn.mock.calls[0][1] as string[];
      expect(spawnArgs).not.toContain('--no-node-snapshot');
    });

    it('should pass --no-node-snapshot even with trailing spaces in NODE_OPTIONS', async () => {
      process.env.NODE_OPTIONS = '--max-old-space-size=4096 ';

      runBackend({ entry: 'src/index' });

      await jest.advanceTimersByTimeAsync(100);

      expect(mockSpawn).toHaveBeenCalled();
      const spawnArgs = mockSpawn.mock.calls[0][1] as string[];
      expect(spawnArgs).toContain('--no-node-snapshot');
    });

    it('should pass --no-node-snapshot alongside other option args like --inspect', async () => {
      delete process.env.NODE_OPTIONS;

      runBackend({ entry: 'src/index', inspectEnabled: true });

      await jest.advanceTimersByTimeAsync(100);

      expect(mockSpawn).toHaveBeenCalled();
      const spawnArgs = mockSpawn.mock.calls[0][1] as string[];
      expect(spawnArgs).toContain('--no-node-snapshot');
      expect(spawnArgs).toContain('--inspect');
    });
  });

  describe('embedded-postgres support', () => {
    it('should start embedded DB and inject all defaults when no user connection config is provided', async () => {
      mockConfig({
        getOptionalString: (key: string) =>
          key === 'backend.database.client' ? 'embedded-postgres' : undefined,
      });
      mockStartEmbeddedDb.mockResolvedValue({
        connection: {
          host: 'localhost',
          user: 'postgres',
          password: 'password',
          port: 5555,
        },
        defaultedConnection: {
          host: 'localhost',
          user: 'postgres',
          password: 'password',
          port: 5555,
        },
        close: jest.fn(),
      });

      runBackend({ entry: 'src/index' });
      await jest.advanceTimersByTimeAsync(100);

      expect(mockStartEmbeddedDb).toHaveBeenCalledWith(undefined);
      const spawnEnv = mockSpawn.mock.calls[0][2]?.env as Record<
        string,
        string
      >;
      const injected = JSON.parse(spawnEnv.APP_CONFIG_backend_database);
      expect(injected).toEqual({
        client: 'pg',
        connection: {
          host: 'localhost',
          user: 'postgres',
          password: 'password',
          port: 5555,
        },
      });
    });

    it('should forward user-provided connection config and only inject defaults for missing values', async () => {
      const configValues: Record<string, string | number> = {
        'backend.database.client': 'embedded-postgres',
        'backend.database.connection.host': '0.0.0.0',
        'backend.database.connection.port': 15432,
      };
      mockConfig({
        getOptional: ((key: string) =>
          key === 'backend.database.connection'
            ? { host: '0.0.0.0', port: 15432 }
            : undefined) as any,
        getOptionalString: (key: string) => {
          const val = configValues[key];
          return typeof val === 'string' ? val : undefined;
        },
        getOptionalNumber: (key: string) => {
          const val = configValues[key];
          return typeof val === 'number' ? val : undefined;
        },
      });
      mockStartEmbeddedDb.mockResolvedValue({
        connection: {
          host: '0.0.0.0',
          user: 'postgres',
          password: 'password',
          port: 15432,
        },
        defaultedConnection: {
          user: 'postgres',
          password: 'password',
        },
        close: jest.fn(),
      });

      runBackend({ entry: 'src/index' });
      await jest.advanceTimersByTimeAsync(100);

      expect(mockStartEmbeddedDb).toHaveBeenCalledWith({
        host: '0.0.0.0',
        port: 15432,
        user: undefined,
        password: undefined,
      });
      const spawnEnv = mockSpawn.mock.calls[0][2]?.env as Record<
        string,
        string
      >;
      const injected = JSON.parse(spawnEnv.APP_CONFIG_backend_database);
      expect(injected).toEqual({
        client: 'pg',
        connection: {
          user: 'postgres',
          password: 'password',
        },
      });
    });

    it('should not inject connection overrides when all values are user-provided', async () => {
      const configValues: Record<string, string | number> = {
        'backend.database.client': 'embedded-postgres',
        'backend.database.connection.host': '0.0.0.0',
        'backend.database.connection.port': 15432,
        'backend.database.connection.user': 'myuser',
        'backend.database.connection.password': 'mypass',
      };
      mockConfig({
        getOptional: ((key: string) =>
          key === 'backend.database.connection'
            ? {
                host: '0.0.0.0',
                port: 15432,
                user: 'myuser',
                password: 'mypass',
              }
            : undefined) as any,
        getOptionalString: (key: string) => {
          const val = configValues[key];
          return typeof val === 'string' ? val : undefined;
        },
        getOptionalNumber: (key: string) => {
          const val = configValues[key];
          return typeof val === 'number' ? val : undefined;
        },
      });
      mockStartEmbeddedDb.mockResolvedValue({
        connection: {
          host: '0.0.0.0',
          user: 'myuser',
          password: 'mypass',
          port: 15432,
        },
        defaultedConnection: {},
        close: jest.fn(),
      });

      runBackend({ entry: 'src/index' });
      await jest.advanceTimersByTimeAsync(100);

      expect(mockStartEmbeddedDb).toHaveBeenCalledWith({
        host: '0.0.0.0',
        port: 15432,
        user: 'myuser',
        password: 'mypass',
      });
      const spawnEnv = mockSpawn.mock.calls[0][2]?.env as Record<
        string,
        string
      >;
      const injected = JSON.parse(spawnEnv.APP_CONFIG_backend_database);
      expect(injected).toEqual({ client: 'pg' });
    });

    it('should resolve config paths relative to targetDir', async () => {
      runBackend({
        entry: 'src/index',
        targetDir: '/root/packages/backend',
        configPaths: ['../../config/local.yaml'],
      });
      await jest.advanceTimersByTimeAsync(100);

      expect(mockConfigSourcesDefault).toHaveBeenCalledWith(
        expect.objectContaining({
          argv: ['--config', '/root/config/local.yaml'],
        }),
      );
    });

    it('should not start embedded DB for other database clients with a string connection', async () => {
      mockConfig({
        getOptional: ((key: string) =>
          key === 'backend.database.connection'
            ? ':memory:'
            : undefined) as any,
        getOptionalString: (key: string) =>
          key === 'backend.database.client' ? 'better-sqlite3' : undefined,
      });

      runBackend({ entry: 'src/index' });
      await jest.advanceTimersByTimeAsync(100);

      expect(mockStartEmbeddedDb).not.toHaveBeenCalled();
      const spawnEnv = mockSpawn.mock.calls[0][2]?.env as Record<
        string,
        string
      >;
      expect(spawnEnv.APP_CONFIG_backend_database).toBeUndefined();
    });
  });
});
