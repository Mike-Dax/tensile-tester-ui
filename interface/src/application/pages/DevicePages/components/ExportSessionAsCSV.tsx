import { CancellationToken } from '@electricui/async-utilities'
import { CSVExporter, Frontier, PERSISTENCE, Query, Time, Queryable } from '@electricui/core-timeseries'

import { Button, Intent } from '@blueprintjs/core'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { SaveDialogOptions, SaveDialogReturnValue, ipcRenderer } from 'electron'
import { SAVE_DIALOG_IPC_EVENT } from '@electricui/utility-electron'
import { IconNames } from '@blueprintjs/icons'

import { useDataSubscription } from '@electricui/timeseries-react'
export function ExportSessionAsCSV<
  T,
  Columns extends {
    header: string
    accessor?: (data: T, time: Time) => string | number
  }[],
>(props: { queryable: Queryable<T>; columns: Columns; disabled?: boolean }) {
  const [err, setErr] = useState<Error | null>(null)

  const currentCancellationToken = useRef<CancellationToken | null>(null)

  const [disabled, setDisabled] = useState(false)
  const [isWriting, setIsWriting] = useState(false)

  const request = useDataSubscription()

  const write = useCallback(async () => {
    try {
      setDisabled(true)
      const options: SaveDialogOptions = {
        filters: [{ name: '.csv', extensions: ['csv'] }],
        message: 'Select a Save Location',
      }

      const dialogReturn: { filePath: string; canceled: boolean } = await ipcRenderer.invoke(
        SAVE_DIALOG_IPC_EVENT,
        options,
      )

      if (dialogReturn.canceled) {
        return
      }

      const filePath = dialogReturn.filePath

      setDisabled(false)
      setIsWriting(true)

      const query = new Query().persist(PERSISTENCE.IMMEDIATE)
      const frontier = new Frontier()
      const cancellationToken = new CancellationToken()
      currentCancellationToken.current = cancellationToken

      const csvExporter = new CSVExporter(setErr)

      // Run the write
      await csvExporter.export(request, props.queryable, props.columns, filePath, query, cancellationToken, frontier)
    } finally {
      setIsWriting(false)
      setDisabled(false)
    }
  }, [setErr, props.queryable, props.columns, setIsWriting, setDisabled])

  const onClick = useCallback(
    async (event: React.MouseEvent<HTMLElement, MouseEvent>) => {
      // Don't let the thing behind this button capture the click
      event.stopPropagation()

      if (isWriting) {
        if (currentCancellationToken.current) {
          currentCancellationToken.current.cancel()
        }
      } else {
        await write()
      }
    },
    [write, isWriting],
  )

  if (isWriting) {
    return (
      <>
        <Button
          onClick={onClick}
          intent={Intent.DANGER}
          icon={IconNames.DELETE}
          disabled={disabled || props.disabled}
          loading={disabled}
        />
      </>
    )
  }

  return (
    <>
      <Button
        onClick={onClick}
        intent={Intent.SUCCESS}
        icon={IconNames.FLOPPY_DISK}
        disabled={disabled || props.disabled}
        loading={disabled}
      />
    </>
  )
}
