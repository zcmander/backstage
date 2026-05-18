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

import { tracingServiceMock } from './TracingServiceMock';

describe('tracingServiceMock', () => {
  it('parses the baggage header via propagation.extract and exposes it via getActiveBaggage inside context.with', async () => {
    const tracing = tracingServiceMock.mock();

    const ctx = tracing.propagation.extract(tracing.context.active(), {
      baggage:
        'gen_ai.conversation.id=conv-123, gen_ai.agent.id=agent-456;property=ignored',
    });

    // Baggage is reachable directly off the extracted handle.
    expect(
      tracing.propagation.getBaggage(ctx)?.getEntry('gen_ai.agent.id'),
    ).toEqual({ value: 'agent-456' });

    const seen = await tracing.context.with(ctx, () => {
      const baggage = tracing.propagation.getActiveBaggage();
      return {
        conv: baggage?.getEntry('gen_ai.conversation.id')?.value,
        agent: baggage?.getEntry('gen_ai.agent.id')?.value,
        missing: baggage?.getEntry('gen_ai.missing'),
        all: baggage?.getAllEntries().map(([k, v]) => [k, v.value]),
      };
    });

    expect(seen).toEqual({
      conv: 'conv-123',
      agent: 'agent-456',
      missing: undefined,
      all: [
        ['gen_ai.conversation.id', { value: 'conv-123' }],
        ['gen_ai.agent.id', { value: 'agent-456' }],
      ].map(([k, v]) => [k, (v as { value: string }).value]),
    });

    // Baggage is scoped to the context.with callback.
    expect(tracing.propagation.getActiveBaggage()).toBeUndefined();
  });

  it('honours mockReturnValue overrides for getActiveBaggage', async () => {
    const tracing = tracingServiceMock.mock();
    const override = {
      getEntry: () => ({ value: 'override' }),
      getAllEntries: () =>
        [['gen_ai.conversation.id', { value: 'override' }]] as Array<
          [string, { value: string }]
        >,
    };
    tracing.propagation.getActiveBaggage.mockReturnValue(override);

    expect(tracing.propagation.getActiveBaggage()).toBe(override);
    const ctx = tracing.propagation.extract(tracing.context.active(), {
      baggage: 'gen_ai.conversation.id=conv-from-header',
    });
    await tracing.context.with(ctx, () => {
      // mockReturnValue takes precedence over the default header parsing.
      expect(tracing.propagation.getActiveBaggage()).toBe(override);
    });
  });

  it('returns undefined baggage when no baggage header is supplied to extract', async () => {
    const tracing = tracingServiceMock.mock();
    const ctx = tracing.propagation.extract(tracing.context.active(), {
      traceparent: 'whatever',
    });
    await tracing.context.with(ctx, () => {
      expect(tracing.propagation.getActiveBaggage()).toBeUndefined();
    });
  });
});
