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
  it('parses the baggage header from withPropagatedContext and exposes it via getActiveBaggage', async () => {
    const tracing = tracingServiceMock.mock();

    const seen = await tracing.withPropagatedContext(
      {
        baggage:
          'gen_ai.conversation.id=conv-123, gen_ai.agent.id=agent-456;property=ignored',
      },
      () => {
        const baggage = tracing.getActiveBaggage();
        return {
          conv: baggage?.getEntry('gen_ai.conversation.id')?.value,
          agent: baggage?.getEntry('gen_ai.agent.id')?.value,
          missing: baggage?.getEntry('gen_ai.missing'),
          all: baggage?.getAllEntries().map(([k, v]) => [k, v.value]),
        };
      },
    );

    expect(seen).toEqual({
      conv: 'conv-123',
      agent: 'agent-456',
      missing: undefined,
      all: [
        ['gen_ai.conversation.id', 'conv-123'],
        ['gen_ai.agent.id', 'agent-456'],
      ],
    });

    // Baggage is scoped to the propagated callback.
    expect(tracing.getActiveBaggage()).toBeUndefined();
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
    tracing.getActiveBaggage.mockReturnValue(override);

    expect(tracing.getActiveBaggage()).toBe(override);
    await tracing.withPropagatedContext(
      { baggage: 'gen_ai.conversation.id=conv-from-header' },
      () => {
        // mockReturnValue takes precedence over the default header parsing.
        expect(tracing.getActiveBaggage()).toBe(override);
      },
    );
  });

  it('returns undefined baggage when no baggage header is supplied', async () => {
    const tracing = tracingServiceMock.mock();
    await tracing.withPropagatedContext({ traceparent: 'whatever' }, () => {
      expect(tracing.getActiveBaggage()).toBeUndefined();
    });
  });
});
