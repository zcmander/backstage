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

/**
 * Adds support for the AiResource entity kind to the catalog backend plugin.
 *
 * @packageDocumentation
 */

export type {
  AiResourceEntityV1alpha1,
  AiResourceEntityV1alpha1Default,
  SkillAiResourceEntityV1alpha1,
} from './AiResourceEntityV1alpha1';
export {
  aiResourceEntityV1alpha1Validator,
  skillAiResourceEntityV1alpha1Validator,
  isAiResourceEntity,
  isSkillAiResourceEntity,
} from './AiResourceEntityV1alpha1';
export { catalogModuleAiResourceEntityModel as default } from './module';
