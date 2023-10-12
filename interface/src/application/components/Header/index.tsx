import { Alignment, Button, Intent, Navbar, Tag } from '@blueprintjs/core'
import {
  useDeadline,
  useDeviceConnect,
  useDeviceConnectionRequested,
  useDeviceDisconnect,
} from '@electricui/components-core'

import React from 'react'
import { RouteComponentProps } from '@reach/router'
import { navigate } from '@electricui/utility-electron'
import { DataSourcePrinter } from '@electricui/components-desktop-charts'
import { useMessageDataSource } from '@electricui/core-timeseries'

interface InjectDeviceIDFromLocation {
  deviceID?: string
  '*'?: string // we get passed the path as the wildcard
}

export const Header = (props: RouteComponentProps & InjectDeviceIDFromLocation) => {
  const disconnect = useDeviceDisconnect()
  const connect = useDeviceConnect()
  const connectionRequested = useDeviceConnectionRequested()
  const getDeadline = useDeadline()

  const displacementDS = useMessageDataSource('disp')
  const forceDS = useMessageDataSource('force')

  return (
    <div className="device-header">
      <Navbar
        style={{ background: 'transparent', boxShadow: 'none', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr' }}
      >
        <Navbar.Group>
          <Button
            minimal
            large
            icon="home"
            text="Back"
            onClick={() => {
              navigate('/')
            }}
          />

          {connectionRequested ? (
            <Button
              minimal
              large
              intent="danger"
              icon="cross"
              text="Disconnect"
              onClick={() => {
                disconnect().catch(err => {
                  console.warn('Failed to disconnect', err)
                })
                // Go home on disconnect
                navigate(`/`)
              }}
            />
          ) : (
            <Button
              minimal
              large
              icon="link"
              intent="success"
              text="Connect again"
              onClick={() => {
                const cancellationToken = getDeadline()

                connect(cancellationToken).catch(err => {
                  if (cancellationToken.caused(err)) {
                    return
                  }

                  console.warn('Failed to connect', err)
                })
              }}
            />
          )}
        </Navbar.Group>
        <Navbar.Group style={{ textAlign: 'center' }}>{/* What to put here? */}</Navbar.Group>
        <Navbar.Group style={{ display: 'flex', gap: '1em', justifyContent: 'end', paddingRight: '1em' }}>
          <Tag large intent={Intent.PRIMARY} minimal>
            Force:{' '}
            <span style={{ fontFamily: 'monospace' }}>
              <DataSourcePrinter dataSource={forceDS} />
            </span>
            kN
          </Tag>
          <Tag large intent={Intent.PRIMARY} minimal>
            Displacement:{' '}
            <span style={{ fontFamily: 'monospace' }}>
              <DataSourcePrinter dataSource={displacementDS} />
            </span>
            mm
          </Tag>
        </Navbar.Group>
        {/* <Navbar.Group align={Alignment.RIGHT}>
            <Button
              minimal
              large
              icon="dashboard"
              text="Overview"
              onClick={() => {
                navigate(`/devices/${props.deviceID}/`)
              }}
              active={page === ''}
            />
          </Navbar.Group> */}
      </Navbar>
    </div>
  )
}
