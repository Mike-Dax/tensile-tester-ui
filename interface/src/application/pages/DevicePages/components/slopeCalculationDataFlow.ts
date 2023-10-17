import React, { useState } from 'react'

import { Button, Card, InputGroup, Intent, Elevation, Callout, Divider, ButtonGroup } from '@blueprintjs/core'
import { IconNames } from '@blueprintjs/icons'

import {
  ZoomWrapper,
  DataSourcePrinter,
  KeyedLegendDefinitions,
  KeyedAnnotatedLegendData,
} from '@electricui/components-desktop-charts'
import { DEVICE_ID_ARBITRARY_KEY, useMessageDataSource } from '@electricui/core-timeseries'
import { SessionRecorder } from '@electricui/components-desktop-blueprint-timeseries'

import { coalesce, DataTransformer, count, map } from '@electricui/dataflow'
import { SessionWithAPI, useInMemorySessionSource } from '@electricui/core-timeseries'
import { DeviceID } from '@electricui/core'
import { useSignal } from '@electricui/signals'
import { useDarkMode } from '@electricui/components-desktop'
import { Popover2, Classes, PlacementOptions } from '@blueprintjs/popover2'

export type SessionMetadata = {
  name: string
}
export type SessionIdentity = {
  [DEVICE_ID_ARBITRARY_KEY]: DeviceID
}

export type CustomLegendSignals = {
  dragStart: {
    x: number
    y: number
  } | null
  dragEnd: {
    x: number
    y: number
  } | null
}

export function slopeCalculationDataFlow<
  SessionMetadata extends Record<string, string>,
  IdentityMetadata extends Record<string, string>,
>(
  session: SessionWithAPI<SessionMetadata, IdentityMetadata>,
  legend: KeyedAnnotatedLegendData<KeyedLegendDefinitions, CustomLegendSignals>,
) {
  return new DataTransformer(() =>
    map(
      coalesce({
        dragStart: legend[session.uuid].customSignals.dragStart,
        dragEnd: legend[session.uuid].customSignals.dragEnd,
      }),
      data => {
        if (!data.dragEnd || !data.dragStart) {
          return null
        }

        const dY = data.dragEnd.y - data.dragStart.y
        const dX = data.dragEnd.x - data.dragStart.x

        return dY / dX
      },
    ),
  )
}
