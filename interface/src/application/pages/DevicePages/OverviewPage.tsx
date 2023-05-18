import React from 'react'

import { RouteComponentProps } from '@reach/router'

import {
  ChartContainer,
  HorizontalAxis,
  RealTimeSlicingDomain,
  VerticalAxis,
  TimeSlicedLineChart,
} from '@electricui/components-desktop-charts'
import { MessageDataSource } from '@electricui/core-timeseries'
import { Button } from '@electricui/components-desktop-blueprint'
import { timing } from '@electricui/timing'
import {
  DataTransformer,
  prepare,
  coalesce,
} from '@electricui/dataflow'
import { useLocalSignal } from '@electricui/signals'
import { Colors, Button as BlueprintButton, Intent, Card } from '@blueprintjs/core'
import { IconNames } from '@blueprintjs/icons'

const displacementDS = new MessageDataSource('disp')
const forceDS = new MessageDataSource('force')

export const OverviewPage = (props: RouteComponentProps) => {
  
  // Create a local signal that handles the time cutoff for our current 'session'
  // We'll set this to a new time when we want to filter out any events before that point.
  const [ignoreBefore, setIgnoreBefore] = useLocalSignal(timing.now())

  // Create our force by displacement plot data
  const forceByDisplacementOnlyThisSession = new DataTransformer(({ watch }) => {
    // Coalesce the data from the force and displacement data sources, into the x and y components of the chart
    const forceByDisplacement = coalesce({ x: displacementDS, y: forceDS })

    // The 'prepare' operator lets us cut the data off before this time
    // The 'watch' call lets us re-run this query when it changes.
    const ignoreBeforeVal = watch(ignoreBefore)

    return prepare(forceByDisplacement, query => query.start(ignoreBeforeVal))
  })

  // The actual layout of the UI, just done with quick and easy inline styles
  return (
    <div style={{ padding: 10 }}>
      {/* The title */}
      <div>
        <h1 style={{ textAlign: 'center', fontSize: '4em' }}>Tensile Tester</h1>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 350px', gap: 10, padding: 10 }}>
        {/* Charts */}
        <Card>
          <ChartContainer height={600}>
            {/* Our time sliced line chart, can be replaced with a ScatterPlot  */}
            <TimeSlicedLineChart
              // The actual source of the data
              dataSource={forceByDisplacementOnlyThisSession}
              // The colour of the chart
              color={Colors.GREEN3}
              // If the 'clear session' signal triggers, blank the data in the chart
              blankTrigger={ignoreBefore}
            />
            {/* The domain moves the 'camera' over time */}
            <RealTimeSlicingDomain
              // Set a window in milliseconds
              window={10_000}
              // Use these to determine the domain bounds, better to set them than have the chart jump around a bunch
              yMinSoft={-200}
              yMaxSoft={200}
              xMinSoft={-200}
              xMaxSoft={200}
            />

            {/* Our axes, with their labels, add the units in here */}
            <VerticalAxis label="Force" />
            <HorizontalAxis label="Displacement" />
            {/* Fog fades out old data over time */}
            {/* <Fog color={Colors.WHITE} /> */}
          </ChartContainer>

          {/* Settings */}
        </Card>

        <Card style={{ display: 'grid', gap: 10 }}>
          <div style={{ alignSelf: 'start', display: 'grid', gap: 10 }}>
            <Button callback="home" large fill intent={Intent.WARNING}>
              Home
            </Button>
            <Button callback="run" large fill intent={Intent.SUCCESS}>
              Run
            </Button>
          </div>
          <div style={{ alignSelf: 'center', display: 'grid', gap: 10 }}>
            <Button callback="up" large fill intent={Intent.PRIMARY} icon={IconNames.CHEVRON_UP}>
              Up
            </Button>
            <Button callback="down" large fill intent={Intent.PRIMARY} icon={IconNames.CHEVRON_DOWN}>
              Down
            </Button>
          </div>

          {/* This button sets the time signal to 'now', cutting off any data before it */}
          <div style={{ alignSelf: 'end' }}>
            <BlueprintButton
              onClick={() => {
                setIgnoreBefore(timing.now())
              }}
              large
              fill
              intent={Intent.DANGER}
            >
              Clear Plot
            </BlueprintButton>
          </div>
        </Card>
      </div>
    </div>
  )
}
