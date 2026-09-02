/**
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
import { GenericDataType } from '@apache-superset/core/common';
import { QueryFormData } from '@superset-ui/core';
import {
  ControlConfig,
  ControlPanelState,
  ControlState,
  Dataset,
  isCustomControlItem,
} from '@superset-ui/chart-controls';
import config from '../../src/plugin/controlPanel';

const findConditionalFormattingControl = (): ControlConfig | null => {
  for (const section of config.controlPanelSections) {
    if (!section) continue;
    for (const row of section.controlSetRows) {
      for (const control of row) {
        if (
          isCustomControlItem(control) &&
          control.name === 'conditional_formatting'
        ) {
          return control.config;
        }
      }
    }
  }
  return null;
};

const createMockControlState = (value: string[]): ControlState => ({
  type: 'SelectControl',
  value,
  label: '',
  default: undefined,
  renderTrigger: false,
});

const createMockExplore = (): ControlPanelState =>
  ({
    slice: { slice_id: 123 },
    datasource: {
      verbose_map: { sales: 'Sales', order_date: 'Order Date' },
      columns: [],
    } as Partial<Dataset> as Dataset,
    controls: {
      metrics: createMockControlState(['sum__sales']),
      groupbyColumns: createMockControlState(['order_date']),
      groupbyRows: createMockControlState(['region']),
    },
    form_data: {
      datasource: '1__table',
      viz_type: 'pivot_table',
    } as QueryFormData,
    common: {},
    metadata: {},
  }) as ControlPanelState;

const createMockChart = () => ({
  chartStatus: 'success' as const,
  queriesResponse: [
    {
      colnames: ['sum__sales', 'order_date', 'region'],
      coltypes: [
        GenericDataType.Numeric,
        GenericDataType.Temporal,
        GenericDataType.String,
      ],
    },
  ],
});

test('only offers metric columns to the conditional formatting control', () => {
  const controlConfig = findConditionalFormattingControl();
  expect(controlConfig).toBeTruthy();
  expect(controlConfig?.mapStateToProps).toBeTruthy();

  const result = controlConfig!.mapStateToProps!(
    createMockExplore(),
    createMockControlState([]),
    createMockChart(),
  ) as { columnOptions: { value: string; dataType: string }[] };

  // The renderer colors metric cells only, so groupby columns and rows
  // must not be offered as format targets
  expect(result.columnOptions).toEqual([
    {
      value: 'sum__sales',
      label: undefined,
      dataType: GenericDataType.Numeric,
    },
  ]);
});
