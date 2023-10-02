import 'source-map-support/register'
import '@blueprintjs/icons/lib/css/blueprint-icons.css'
import '@blueprintjs/core/lib/css/blueprint.css'
import '@electricui/components-desktop-blueprint/lib/bundle.css'

import { deviceManager } from './config'
import { setupProxyAndDebugInterface } from '@electricui/components-desktop-blueprint'
import { setupTransportWindow } from '@electricui/utility-electron'
import {
  ElectronIPCRemoteQueryExecutor,
  MultiPersistenceEngineMemory,
  QueryableMessageIDProvider,
  TransportSessionStorage,
  InMemorySessionStorage,
} from '@electricui/core-timeseries'

import { FocusStyleManager } from '@blueprintjs/core'
FocusStyleManager.onlyShowFocusOnTabs()

const root = document.createElement('div')
document.body.appendChild(root)

const hotReloadHandler = setupProxyAndDebugInterface(root, deviceManager)
setupTransportWindow()

const multiPersistenceEngine = new MultiPersistenceEngineMemory()
const remoteQueryExecutor = new ElectronIPCRemoteQueryExecutor(multiPersistenceEngine)
const queryableMessageIDProvider = new QueryableMessageIDProvider(deviceManager, multiPersistenceEngine)
const sessionStorage = new TransportSessionStorage()
const inMemorySessionStorage = new InMemorySessionStorage(multiPersistenceEngine, sessionStorage)

// messageIDQueryable.setDefaultDecimatorFactory(queryable => queryable)

if (module.hot) {
  module.hot.accept('./config', () => hotReloadHandler(root, deviceManager))
}
