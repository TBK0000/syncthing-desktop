import { app, BrowserWindow, powerMonitor, ipcMain } from 'electron'
import notify from './utils/notify'
import { connections, myID } from './actions/system'
import { folderStatus } from './actions/db'

export function mainEvents(store) {

  ipcMain.on('ready', (e, winId) => {
    const win = BrowserWindow.fromId(winId)
    win.show()
    win.focus()
    app.dock.show()
  })

  app.on('window-all-closed', () => {
    app.dock.hide()
    if (process.platform !== 'darwin')
      app.quit()
  })
  
  //Dispatch action on suspension changes
  powerMonitor.on('suspend', () => {
    store.dispatch({ type: 'SUSPEND' })
  })

  //Dispatch action on resumation changes
  powerMonitor.on('resume', () => {
    store.dispatch({ type: 'RESUME' })
  })

  if (process.env.NODE_ENV === 'development') {

    //Listen for hot reloads
    ipcMain.on('renderer-reload', event => {
      delete require.cache[require.resolve('./reducers/index')]
      store.replaceReducer(require('./reducers/index'))
      event.returnValue = true
    })
  }

}
export function stEvents(store){

  //Listen for devices connecting
  global.st.on('deviceConnected', ({ id, addr }) => {
    const { name } = store.getState().devices.filter(device => device.deviceID == id)[0]
    notify(`Connected to ${name}`, `on ${addr}`)
    store.dispatch(connections())
  })
  //Listen for devices disconnecting
  global.st.on('deviceDisconnected', ({id}) => {
    const { name } = store.getState().devices.filter(device => device.deviceID == id)[0]
    notify(`${name} disconnected`, 'Syncing to this device is paused')
    store.dispatch(connections())
  })
  //Listen for errors
  global.st.on('error', () => {
    store.dispatch({ type: 'CONNECTION_ERROR' })
  })
  //Listen for folder state changes
  global.st.on('stateChanged', ({ folder, to }) => {
    const state = store.getState()
    switch (to) {
    case 'syncing':
      notify('Syncthing', `${folder} is Syncing`)
      store.dispatch(folderStatus(state.folders))
      break
    case 'error':
      notify(`${folder} has an Error`, 'click to see the error in the dashboard.')
      break
    case 'idle':
      store.dispatch(folderStatus(state.folders))
      break
    }
  })

  //Check periodicaly for connections
  setInterval(() => {
    const state = store.getState()
    if(state.connected && state.power == 'awake'){
      store.dispatch(connections())
      store.dispatch(myID())
    }
  }, 2000)

}
