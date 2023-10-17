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
  ScatterPlot,
  PointAnnotation,
  MouseCapture,
  useMouseSignal,
  useDataSourceSubscription,
  LineSegmentAnnotation,
} from '@electricui/components-desktop-charts'
import { useMessageDataSource } from '@electricui/core-timeseries'
import { closestSpatially, coalesce, DataTransformer, interleave, map } from '@electricui/dataflow'
import { useFilterSessionsFromQueryable, SessionWithAPI } from '@electricui/core-timeseries'
import { useSignal } from '@electricui/signals'

import { SessionMetadata, SessionIdentity, CustomLegendSignals } from './SessionList'
import { useDataSubscription, useDataTransformer } from '@electricui/timeseries-react'

export function CentralChart(props: {
  legend: KeyedAnnotatedLegendData<KeyedLegendDefinitions, CustomLegendSignals>
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
    return coalesce({ x: displacementDS, y: forceDS }, { synchronize: true })
  })

  // Remove data in sessions from the 'live' source
  // Since we're just using a PointAnnotation, we can ignore this, since we'll only
  // be displaying the latest point.
  // const filterLiveFromSessions = useFilterSessionsFromQueryable(forceByDisplacement, sessions)

  const liveSignalSelected = useSignal(legend.live.selected)

  // Mouse interaction handling:
  const [mouseSignal, captureRef] = useMouseSignal()

  // A DataTransformer that selects the closest session with its data point
  const closestDataPointWithSessionUUID = useDataTransformer(
    () =>
      // Find the closest data point,
      closestSpatially(
        // combining all sessions,
        interleave(
          sessions.map(session =>
            // selecting just their time slices
            map(session.select(forceByDisplacement), data => ({
              data,
              // and including their session uuid in the data
              sessionUUID: session.uuid,
            })),
          ),
        ),
        // based on the position of the mouse
        mouseSignal,
        {
          queryablePositionAccessor: data => (data.data ? { x: data.data.x, y: data.data.y } : null),
          // accounting for the chart aspect ratio
          searchSourceAccessor: data => ({ x: data.x, y: data.y, chartAspectRatio: data.chartAspectRatio }),
          // Only searching data points which are currently visible
          searchResultPredicate: (queryableEventData, queryableEventTime, searchEventData) =>
            legend[queryableEventData.sessionUUID].visible.peek(),
        },
      ),
    [sessions], // Recalculate on sessions change
  )

  // Set the hovered state based on the closest hover point
  useDataSourceSubscription(closestDataPointWithSessionUUID, closest => {
    const mouseData = closest.searchEventData
    // If the mouse is not dragging,
    // Hover the session of the closest data, if the mouse is no longer hovered, unhover it.
    if (!mouseData.mouseDown) {
      legend[closest.event.data.sessionUUID].setHovered(mouseData.hovered)
    }
  })

  // A DataTransformer that selects the closest points in a single session to the start and end drag points
  const closestDataPointOnInitialDragWithSessionUUID = useDataTransformer(
    () => {
      const combineAllSessions = interleave(
        sessions.map(session =>
          // selecting just their time slices
          map(session.select(forceByDisplacement), data => ({
            data,
            // and including their session uuid in the data
            sessionUUID: session.uuid,
          })),
        ),
      )

      const closestInitialPoint = closestSpatially(
        // combining all sessions,
        combineAllSessions,
        // based on the position of the inital drag event
        mouseSignal,
        {
          queryablePositionAccessor: data => (data.data ? { x: data.data.x, y: data.data.y } : null),
          // accounting for the chart aspect ratio
          searchSourceAccessor: data => ({
            x: data.dragInitialX,
            y: data.dragInitialY,
            chartAspectRatio: data.chartAspectRatio,
          }),
          // Only searching data points which are currently visible
          searchResultPredicate: (queryableEventData, queryableEventTime, searchEventData) =>
            legend[queryableEventData.sessionUUID].visible.peek(),
        },
      )

      // Find the closest final point, restricting the search to the session that's selected in the above
      // query
      const closestFinalPoint = map(
        closestSpatially(combineAllSessions, closestInitialPoint, {
          queryablePositionAccessor: data => (data.data ? { x: data.data.x, y: data.data.y } : null),
          // Only searching data points which are currently visible
          // Which are the same session as the initial point
          searchResultPredicate: (queryableEventData, queryableEventTime, searchEventData) =>
            legend[queryableEventData.sessionUUID].visible.peek() &&
            queryableEventData.sessionUUID == searchEventData.event.data.sessionUUID,

          // Searching for the closest point to the drag final position
          searchSourceAccessor: data => ({
            x: data.searchEventData.dragFinalX,
            y: data.searchEventData.dragFinalY,
            chartAspectRatio: data.searchEventData.chartAspectRatio,
          }),
        }),
        data => data,
      )

      return coalesce({
        closestInitialPoint,
        closestFinalPoint,
      })
    },
    [sessions], // Recalculate on sessions change
  )

  // Set the hovered state based on the closest hover point
  useDataSourceSubscription(closestDataPointOnInitialDragWithSessionUUID, closestPoints => {
    const mouseData = closestPoints.closestInitialPoint.searchEventData

    const selectedSession = closestPoints.closestInitialPoint.event.data.sessionUUID
    const closestPointInitial = closestPoints.closestInitialPoint
    const closestPointFinal = closestPoints.closestFinalPoint

    // Set the drag start and end
    legend[selectedSession].customSignals.dragStart.set(
      mouseData.hasDragged
        ? {
            x: closestPointInitial.x,
            y: closestPointInitial.y,
          }
        : null,
    )
    legend[selectedSession].customSignals.dragEnd.set(
      mouseData.hasDragged
        ? {
            x: closestPointFinal.x,
            y: closestPointFinal.y,
          }
        : null,
    )
  })

  return (
    <ChartContainer height="calc(100vh - 60px - 40px - 40px)">
      {/* Every session is drawn under the live view  */}
      {sessions.map(session => {
        // Calculate slope of the defined range per session
        // only display if hovered, or if

        // Should be able to hover over the chart, the closest session is the one that's "hovered".
        // useHo

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

      {/* TODO: Need to invert the threeComponent search so we can componentise these instead of mapping over the array 3 times */}
      {/* Drag start marker */}
      {sessions.map(session => {
        return (
          <PointAnnotation
            dataSource={legend[session.uuid].customSignals.dragStart}
            size={6}
            color={legend[session.uuid].color}
            opacitySource={legend[session.uuid].opacity}
            // opacity={recording ? 0 : 1} // Hide the realtime chart if recording (opacity and opacitySource are multiplicative)
            visibilitySource={legend[session.uuid].visible}
            affectBounds
          />
        )
      })}
      {/* Drag end marker */}
      {sessions.map(session => {
        return (
          <PointAnnotation
            dataSource={legend[session.uuid].customSignals.dragEnd}
            size={6}
            color={legend[session.uuid].color}
            opacitySource={legend[session.uuid].opacity}
            // opacity={recording ? 0 : 1} // Hide the realtime chart if recording (opacity and opacitySource are multiplicative)
            visibilitySource={legend[session.uuid].visible}
            affectBounds
          />
        )
      })}
      {/* Drag line marker */}
      {sessions.map(session => {
        return (
          <LineSegmentAnnotation
            dataSource={
              new DataTransformer(() =>
                coalesce({
                  dragStart: legend[session.uuid].customSignals.dragStart,
                  dragEnd: legend[session.uuid].customSignals.dragEnd,
                }),
              )
            }
            accessor={data =>
              data.dragStart && data.dragEnd
                ? {
                    startX: data.dragStart.x,
                    startY: data.dragStart.y,
                    endX: data.dragEnd.x,
                    endY: data.dragEnd.y,
                  }
                : null
            }
            lineWidth={2}
            color={legend[session.uuid].color}
            opacitySource={legend[session.uuid].opacity}
            // opacity={recording ? 0 : 1} // Hide the realtime chart if recording (opacity and opacitySource are multiplicative)
            visibilitySource={legend[session.uuid].visible}
            affectBounds
          />
        )
      })}

      {/* Our live data is represented as a point annotation */}
      <PointAnnotation
        // The actual source of the data
        dataSource={forceByDisplacement}
        // The colour of the chart
        color={Colors.ORANGE3}
        // Line width
        size={8}
        // Opacity and visibility is driven by the legend
        opacitySource={legend.live.opacity}
        visibilitySource={legend.live.visible}
        affectBounds
      />

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
      <MouseCapture captureRef={captureRef} />
    </ChartContainer>
  )
}
