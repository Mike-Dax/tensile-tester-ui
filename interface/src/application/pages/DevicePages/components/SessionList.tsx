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

import { coalesce, DataTransformer, count } from '@electricui/dataflow'
import { SessionWithAPI, useInMemorySessionSource } from '@electricui/core-timeseries'
import { DeviceID } from '@electricui/core'
import { useSignal } from '@electricui/signals'
import { useDarkMode } from '@electricui/components-desktop'
import { Popover2, Classes, PlacementOptions } from '@blueprintjs/popover2'

import { ExportSessionAsCSV } from './ExportSessionAsCSV'

export type SessionMetadata = {
  name: string
}
export type SessionIdentity = {
  [DEVICE_ID_ARBITRARY_KEY]: DeviceID
}

export function SessionList(props: {
  legend: KeyedAnnotatedLegendData<KeyedLegendDefinitions>
  sessions: SessionWithAPI<SessionMetadata, SessionIdentity>[]
  recording: boolean
}) {
  const [currentName, setCurrentName] = useState('')

  const { updateSession } = useInMemorySessionSource()

  // Display the session when hovered even if it's not visible
  const legend = props.legend
  const sessions = props.sessions
  const recording = props.recording

  const liveSignalSelected = useSignal(legend.live.selected)

  const darkMode = useDarkMode()

  return (
    <>
      {/* This layouts with height: min-content with the CSS grid in OverviewPage */}
      <div>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 10 }}>
          <InputGroup
            onChange={event => setCurrentName(event.target.value)}
            value={currentName}
            placeholder="Session Name"
            disabled={recording}
          />
          <SessionRecorder
            updateSession={session => {
              console.log(`new session!`, session)
              updateSession(session)
            }}
            metadata={{ name: currentName }}
            disabled={currentName === '' || Boolean(sessions.find(session => session.metadata.name === currentName))}
            onRecordingFinish={session => {
              // Wipe the metadata on finish
              setCurrentName('')
            }}
            startRecordingText="Record"
            stopRecordingText="Stop"
          />
        </div>
      </div>

      {/* This layouts with height: 1fr with the CSS grid in OverviewPage, taking up the rest of the space */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
          background: darkMode ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.02)',
          padding: 10,
          // Do a little box shadow to make it look nicer
          boxShadow: darkMode
            ? '0 0 0 0 rgba(19, 124, 189, 0), 0 0 0 0 rgba(19, 124, 189, 0), 0 0 0 0 rgba(19, 124, 189, 0), inset 0 0 0 1px rgba(16, 22, 26, 0.3), inset 0 1px 1px rgba(16, 22, 26, 0.4)'
            : '0 0 0 0 rgba(19, 124, 189, 0), 0 0 0 0 rgba(19, 124, 189, 0), inset 0 0 0 1px rgba(16, 22, 26, 0.15), inset 0 1px 1px rgba(16, 22, 26, 0.2)',
          borderRadius: 3,
        }}
      >
        {sessions.map(session => (
          <SlicedSession legend={legend} session={session} key={session.uuid} />
        ))}
        <div
          onClick={() => legend.live.toggleSelected()}
          onMouseEnter={() => legend.live.setHovered(true)}
          onMouseLeave={() => legend.live.setHovered(false)}
        >
          <Callout
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              paddingTop: 0,
              paddingBottom: 0,
              cursor: 'pointer',
              // doesn't switch on and off when you move between the 'tabs'
            }}
            intent={liveSignalSelected ? Intent.PRIMARY : Intent.NONE}
            icon={null}
          >
            <h3 style={{ textOverflow: 'ellipsis' }}>Live windowed view</h3>
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              {/* The delete button would be here */}
            </div>
          </Callout>
        </div>
      </div>

      {/*  Buttons that should go down the bottom */}
      <div>
        <ButtonGroup fill>
          <Button
            icon={IconNames.EYE_OPEN}
            onClick={() => {
              Object.values(legend).forEach(sessionLegend => {
                sessionLegend.setSelected(true)
                sessionLegend.setHovered(false)
              })
            }}
          >
            Show All
          </Button>
          <Button
            icon={IconNames.EYE_OFF}
            onClick={() => {
              Object.values(legend).forEach(sessionLegend => {
                sessionLegend.setSelected(false)
                sessionLegend.setHovered(false)
              })
            }}
          >
            Hide All
          </Button>
        </ButtonGroup>
      </div>
    </>
  )
}

function SlicedSession<
  SessionMetadata extends Record<string, string>,
  IdentityMetadata extends Record<string, string>,
>(props: {
  session: SessionWithAPI<SessionMetadata, IdentityMetadata>
  legend: KeyedAnnotatedLegendData<KeyedLegendDefinitions>
}) {
  const session = props.session
  const legend = props.legend
  const legendEntry = legend[session.uuid]

  const isSelected = useSignal(legendEntry.selected)

  const { removeSession } = useInMemorySessionSource()

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

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  return (
    // Wrap it in a ZoomWrapper so any DataSourceTemplates in this card have correct queries for the session.
    <ZoomWrapper isFixed start={session.start} end={session.end}>
      <div
        key={session.uuid}
        onClick={() => legend[session.uuid].toggleSelected()}
        onMouseEnter={() => legend[session.uuid].setHovered(true)}
        onMouseLeave={() => legend[session.uuid].setHovered(false)}
      >
        <Callout
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            paddingTop: 0,
            paddingBottom: 0,
            cursor: 'pointer',
            marginBottom: 10,
          }}
          intent={isSelected ? Intent.PRIMARY : Intent.NONE}
          icon={null}
        >
          <h3>
            {session.metadata.name}:{' '}
            <DataSourcePrinter
              dataSource={session.select(forceByDisplacement)}
              accessor={(data, time) => Math.round((time - session.start) / 1000)}
            />
            s long,{' '}
            <DataSourcePrinter dataSource={new DataTransformer(() => count(session.select(forceByDisplacement)))} />{' '}
            data points
          </h3>

          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 10,
            }}
          >
            {session.recording ? (
              <Button disabled icon={IconNames.RECORD} intent={Intent.PRIMARY} />
            ) : (
              <Popover2
                interactionKind="click"
                popoverClassName={Classes.POPOVER2_CONTENT_SIZING}
                placement={'top-start'}
                hoverCloseDelay={0}
                hoverOpenDelay={0}
                transitionDuration={0}
                onInteraction={(nextState, event) => {
                  event?.stopPropagation()
                }}
                isOpen={deleteDialogOpen}
                content={
                  <Card style={{ zIndex: 5, width: 300, padding: 10 }} elevation={Elevation.FOUR}>
                    <h3 style={{ margin: 0, paddingBottom: 10 }}>Confirm deletion</h3>
                    <p>Are you sure you want to delete this session?</p>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 15 }}>
                      <Button
                        className={Classes.POPOVER2_DISMISS}
                        style={{ marginRight: 10 }}
                        onClick={event => {
                          event.stopPropagation() // Don't let the outer div onClick handler receive this event, we're handling it.
                          setDeleteDialogOpen(false)
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        intent={Intent.DANGER}
                        className={Classes.POPOVER2_DISMISS}
                        onClick={event => {
                          removeSession(session.uuid)

                          event.stopPropagation() // Don't let the outer div onClick handler receive this event, we're handling it.
                          setDeleteDialogOpen(false)
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                  </Card>
                }
                renderTarget={({ isOpen, ref, onClick, ...targetProps }) => (
                  <Button
                    {...targetProps}
                    onClick={event => {
                      console.log(`did it run`)
                      event.stopPropagation()
                      onClick!(event)
                      setDeleteDialogOpen(true)
                    }}
                    elementRef={ref!}
                    icon={IconNames.DELETE}
                    intent={Intent.DANGER}
                  />
                )}
              />
            )}

            <ExportSessionAsCSV
              queryable={session.select(forceByDisplacement)}
              columns={[
                { header: 'timestamp', accessor: (data, time) => time },
                { header: 'force', accessor: (data, time) => data.y },
                { header: 'displacement', accessor: (data, time) => data.x },
              ]}
              disabled={session.end === Infinity}
            />
          </div>
        </Callout>
      </div>
    </ZoomWrapper>
  )
}
