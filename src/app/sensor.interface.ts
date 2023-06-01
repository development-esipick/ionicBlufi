export interface ISensor {
  sensorId?:string
  name:string
  sensorType:string
  sensorStatus:string
  batteryLevel:number
  lastTemperature:number
  lastHumidity:number
  lastLux:number
  lastMagnetox?: number
  lastMagnetoy?: number
  lastMagnetoz?: number
  userId:string
  stationId:string
  updatedOn?:string
  createdOn?:string
  registeredOn?:string  
  dataMap?:string
}
