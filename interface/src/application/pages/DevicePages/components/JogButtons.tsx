import React from 'react'

import { Button, Slider } from '@electricui/components-desktop-blueprint'
import { Button as BlueprintButton, Intent, Card, FormGroup, Elevation } from '@blueprintjs/core'
import { Popover2, Classes } from '@blueprintjs/popover2'
import { IconNames } from '@blueprintjs/icons'

export function JogButtons(props: { horizontal?: boolean }) {
  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: props.horizontal ? '1fr 1fr 40px' : '1fr 40px', gap: 10 }}>
        <Button
          large
          fill
          intent={Intent.PRIMARY}
          icon={IconNames.CHEVRON_UP}
          onMouseDownCallback="up"
          onMouseUpCallback="stop"
        >
          Up
        </Button>

        {props.horizontal ? (
          <Button
            large
            fill
            intent={Intent.PRIMARY}
            icon={IconNames.CHEVRON_LEFT}
            onMouseDownCallback="left"
            onMouseUpCallback="stop"
          >
            Left
          </Button>
        ) : null}

        <Popover2
          interactionKind="click"
          popoverClassName={Classes.POPOVER2_CONTENT_SIZING}
          placement="top"
          hoverCloseDelay={0}
          hoverOpenDelay={0}
          transitionDuration={0}
          content={
            <Card style={{ zIndex: 5, display: 'block' }} elevation={Elevation.FOUR}>
              <FormGroup
                helperText="Milliseconds between jog movements."
                label="Jog Interval"
                labelFor="text-input"
                style={{ paddingLeft: 12, paddingRight: 12 }}
              >
                <Slider min={10} max={1000} stepSize={10} labelValues={[0, 100, 250, 500, 750, 1000]}>
                  <Slider.Handle accessor="mv_in" />
                </Slider>
              </FormGroup>
            </Card>
          }
          renderTarget={({ isOpen, ref, ...targetProps }) => (
            <BlueprintButton
              {...targetProps}
              elementRef={ref!}
              intent={Intent.NONE}
              icon={IconNames.TIME}
              minimal
              active
            />
          )}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: props.horizontal ? '1fr 1fr 40px' : '1fr 40px', gap: 10 }}>
        <Button
          large
          fill
          intent={Intent.PRIMARY}
          icon={IconNames.CHEVRON_DOWN}
          onMouseDownCallback="down"
          onMouseUpCallback="stop"
        >
          Down
        </Button>

        {props.horizontal ? (
          <Button
            large
            fill
            intent={Intent.PRIMARY}
            icon={IconNames.CHEVRON_RIGHT}
            onMouseDownCallback="right"
            onMouseUpCallback="stop"
          >
            Right
          </Button>
        ) : null}

        <Popover2
          interactionKind="click"
          popoverClassName={Classes.POPOVER2_CONTENT_SIZING}
          placement="top"
          hoverCloseDelay={0}
          hoverOpenDelay={0}
          transitionDuration={0}
          content={
            <Card style={{ zIndex: 5, display: 'block' }} elevation={Elevation.FOUR}>
              <FormGroup
                label="Jog Distance"
                helperText="Millimeters to move per jog movement."
                labelFor="text-input"
                style={{ paddingLeft: 12, paddingRight: 12 }}
              >
                <Slider min={1} max={100} stepSize={1} labelValues={[0, 25, 50, 75, 100]}>
                  <Slider.Handle accessor="mv_am" />
                </Slider>
              </FormGroup>
            </Card>
          }
          renderTarget={({ isOpen, ref, ...targetProps }) => (
            <BlueprintButton
              active
              {...targetProps}
              elementRef={ref!}
              intent={Intent.NONE}
              icon={IconNames.HORIZONTAL_DISTRIBUTION}
              minimal
            />
          )}
        />
      </div>
    </>
  )
}
