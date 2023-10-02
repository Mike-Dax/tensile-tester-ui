import React from 'react'

import { RouteComponentProps } from '@reach/router'

import { Divider } from '@blueprintjs/core'

import { Colors, Card, Intent } from '@blueprintjs/core'
import {
  ChartContainer,
  HorizontalAxis,
  RealTimeSlicingDomain,
  VerticalAxis,
  TimeSlicedLineChart,
  useConsistentColorFactory,
  useLegend,
} from '@electricui/components-desktop-charts'

import { Button } from '@electricui/components-desktop-blueprint'

import { useSessions, sessionsToLegendDefinition, useInMemorySessionSource } from '@electricui/core-timeseries'

import { IntervalRequester } from '@electricui/components-core'
import { ExportSessionAsCSV } from './components/ExportSessionAsCSV'
import { JogButtons } from './components/JogButtons'
import { SessionMetadata, SessionIdentity, SessionList } from './components/SessionList'
import { CentralChart } from './components/CentralChart'

export const OverviewPage = (props: RouteComponentProps) => {
  // Sessions need to be hoisted up here so both the sidebar and the charts can use the Legend data
  const { sessions, recording } = useSessions<SessionMetadata, SessionIdentity>()

  const getConsistentColor = useConsistentColorFactory()
  const legendDef = sessionsToLegendDefinition(
    sessions,
    session => session.metadata.name,
    session => getConsistentColor(session.uuid) as string,
  )

  // Add a 'live' option to the legend def
  legendDef.live = {
    color: Colors.GRAY5,
    name: 'Live',
  }

  const legend = useLegend(legendDef, { visibleIfHovered: true, unhoveredOpacity: 0.5 })

  // The actual layout of the UI, just done with quick and easy inline styles
  return (
    <>
      <IntervalRequester variables={['led_state']} interval={50} />

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 450px', gap: 10 }}>
        {/* Charts */}
        <Card>
          {/* height = 100vh - height of header - padding of grid - padding of card */}

          <CentralChart legend={legend} sessions={sessions} />

          {/* Settings */}
        </Card>

        <Card
          style={{
            display: 'grid',
            gap: 10,
            // The initial buttons, then SessionList's add session row, then the scrollable list of sessions
            gridTemplateRows: 'min-content min-content 1fr min-content',
            maxHeight: 'calc(100vh - 78px - 40px)', // Limit the height manually
          }}
        >
          <div style={{ alignSelf: 'start', display: 'grid', gap: 10 }}>
            <Button callback="home" large fill intent={Intent.WARNING}>
              Home
            </Button>
            <Button callback="run" large fill intent={Intent.SUCCESS}>
              Run
            </Button>

            <Divider />

            <JogButtons />

            <Divider />
          </div>

          {/* This section uses the rest of the space. It returns two elements, 
          the add new interface, then the scrollable list. */}
          <SessionList legend={legend} sessions={sessions} recording={recording} />
        </Card>
      </div>
    </>
  )
}
