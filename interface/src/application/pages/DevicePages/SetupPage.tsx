import React from 'react'

import { RouteComponentProps } from '@reach/router'

import { JogButtons } from './components/JogButtons'

export const SetupPage = (props: RouteComponentProps) => {
  return (
    <div
      style={{
        display: 'grid',
        justifyContent: 'center',
        alignContent: 'center',

        height: 'calc(100vh - 100px)',
      }}
    >
      <div style={{ width: 300, display: 'grid', gap: 10 }}>
        <JogButtons horizontal />
      </div>
    </div>
  )
}
