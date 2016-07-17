export default function folders(state = [], {type, payload, id, ...action}) {
  switch (type){
    case 'FOLDERS_GET_SUCCESS':
      return payload
    case 'FOLDER_STATUS_GET_SUCCESS':
      return state.map(folder => {
      if(id == folder.id){
        return { ...folder, status: payload }
      }else{
        return folder
      }
    })
    case 'DEVICE_FOLDER_COMPLETION_GET_SUCCESS':
      return state.map(folder => {
      if(folder.id == action.folder){
        return {
          ...folder,
          devices: folder.devices.map(device => {
            if(device.deviceID == action.device){
              return {
                ...device,
                completion: payload.completion,
              }
            }else{
              return device
            }
          }),
        }
      }else{
        return folder
      }
    })
    default:
      return state
  }
}
