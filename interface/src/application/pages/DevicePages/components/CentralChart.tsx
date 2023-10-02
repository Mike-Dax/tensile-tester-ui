import React from 'react'
import { Colors } from '@blueprintjs/core'

import {
  ChartContainer,
  HorizontalAxis,
  StaticDomain,
  VerticalAxis,
  TimeSlicedLineChart,
  KeyedLegendDefinitions,
  KeyedAnnotatedLegendData,
} from '@electricui/components-desktop-charts'
import { useMessageDataSource } from '@electricui/core-timeseries'
import { coalesce, DataTransformer } from '@electricui/dataflow'
import { useFilterSessionsFromQueryable, SessionWithAPI } from '@electricui/core-timeseries'
import { useSignal } from '@electricui/signals'

import { SessionMetadata, SessionIdentity } from './SessionList'

export function CentralChart(props: {
  legend: KeyedAnnotatedLegendData<KeyedLegendDefinitions>
  sessions: SessionWithAPI<SessionMetadata, SessionIdentity>[]
  earliestSessionStart: number | null
  latestSessionEnd: number | null
}) {
  // Grab session and legend data
  const legend = props.legend
  const sessions = props.sessions

  // Build our data sources
  const displacementDS = useMessageDataSource('disp')
  const forceDS = useMessageDataSource('force')

  // Create our force by displacement plot data
  const forceByDisplacement = new DataTransformer(() => {
    // Coalesce the data from the force and displacement data sources, into the x and y components of the chart
    // The second argument specifies if the operator should wait until both force and displacement have been updated before
    // emitting the next event

    // TODO: Sync should be true
    return coalesce({ x: displacementDS, y: forceDS }, false)
  })

  // Remove data in sessions from the 'live' source
  const filterLiveFromSessions = useFilterSessionsFromQueryable(forceByDisplacement, sessions)

  const liveSignalSelected = useSignal(legend.live.selected)

  return (
    <ChartContainer height={'calc(100vh - 78px - 40px - 40px)'}>
      {/* Our time sliced line chart for live data */}
      <TimeSlicedLineChart
        // The actual source of the data
        dataSource={filterLiveFromSessions}
        // The colour of the chart
        color={Colors.GREEN3}
        // Line width
        lineWidth={5}
        // Opacity and visibility is driven by the legend
        opacitySource={legend.live.opacity}
        visibilitySource={legend.live.visible}
      />

      {/* Every session is drawn under the live view  */}
      {sessions.map(session => {
        legend
        return (
          <TimeSlicedLineChart
            key={session.uuid}
            // Select the correct time slice of the DataSource
            dataSource={session.select(forceByDisplacement)}
            lineWidth={3}
            color={legend[session.uuid].color}
            opacitySource={legend[session.uuid].opacity}
            visibilitySource={legend[session.uuid].visible}
          />
        )
      })}

      {/* The domain moves the 'camera' over time */}
      {/* Select the time range across all sessions (regardless of if they're selected) */}
      <StaticDomain
        sortedDimension="z"
        zMin={props.earliestSessionStart ?? -Infinity}
        zMax={liveSignalSelected ? Infinity : props.latestSessionEnd ?? Infinity}
        xMinSoft={-200}
        yMinSoft={-200}
        xMaxSoft={200}
        yMaxSoft={200}
      />

      {/* Our axes, with their labels, add the units in here */}
      <VerticalAxis label="Force" />
      <HorizontalAxis label="Displacement" />
      {/* Fog fades out old data over time */}
      {/* <Fog color={Colors.WHITE} /> */}
    </ChartContainer>
  )
}
