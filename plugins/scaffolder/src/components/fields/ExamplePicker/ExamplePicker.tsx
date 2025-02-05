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
import React, { useEffect, useState } from 'react';
import { ExamplePickerProps } from './schema';
import TextField from '@material-ui/core/TextField';
import Autocomplete from '@material-ui/lab/Autocomplete';

export const ExamplePicker = (props: ExamplePickerProps) => {
  const { onChange, formData } = props;
  const { title } = props.schema;
  const { parentFieldName } = props.uiSchema?.['ui:options'] ?? {};
  const parentFieldValue: string | undefined = parentFieldName
    ? props.formContext.formData[parentFieldName]
    : undefined;

  const [currentParentValue, setParentValue] = useState(parentFieldValue);

  useEffect(() => {
    if (parentFieldName) {
      // Detect clearing out selected value if parent field cleared
      if (!parentFieldValue) {
        onChange(undefined);
      }

      // Detect selecting another value
      if (currentParentValue !== parentFieldValue) {
        onChange(undefined);
        setParentValue(parentFieldValue);
      }
    }
  }, [parentFieldValue, currentParentValue, onChange, parentFieldName]);

  return (
    <>
      ID: ${`autocomplete-${props.idSchema.$id}`}
      <Autocomplete
        id={`autocomplete-${props.idSchema.$id}`}
        options={[
          [currentParentValue, `${props.name}-foo`].join(' '),
          [currentParentValue, `${props.name}-bar`].join(' '),
        ]}
        value={formData === undefined ? null : formData}
        onChange={(_, item) => {
          onChange(item === null ? undefined : item);
        }}
        renderInput={params => (
          <TextField
            {...params}
            label={title}
            margin="dense"
            variant="outlined"
          />
        )}
      />
      <pre>
        Depends: {(parentFieldName ?? '<empty>').padEnd(30)} with value:{' '}
        {(parentFieldValue ?? '<empty>').padEnd(50)}
        stored value on component: {parentFieldValue}
        <br />
        Field: {(formData ?? '<empty>').padEnd(32)}
        formContext: {props.formContext.formData[props.name]}
      </pre>
    </>
  );
};
