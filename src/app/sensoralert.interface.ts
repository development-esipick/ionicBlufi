export interface ISensorAlert {
  sensorId?:string
  userId:string  
  temperatureAlertOn: boolean
  temperatureAlertMin: number
  temperatureAlertMax: number
  humidityAlertOn: boolean
  humidityAlertMin: number
  humidityAlertMax: number
  luxAlertOn: boolean
  luxAlertMin: number
  luxAlertMax: number
  accelAlertOn: boolean
  accelxMin: number
  accelyMin: number
  accelzMin: number
  accelxMax: number
  accelyMax: number
  accelzMax: number
  gyroAlertOn: boolean
  gyroxMin: number
  gyroyMin: number
  gyrozMin: number
  gyroxMax: number
  gyroyMax: number
  gyrozMax: number
  temperatureAlertState: string
  temperatureAlertDate: string
  humidityAlertState: string
  humidityAlertDate: string
  luxAlertState: string
  luxAlertDate: string
  notifyOnEveryEvent: boolean
  notifyOnOpenMinutes: number
  buzzerArmedWater: boolean
  notifyOnWaterDetection: boolean
  sensorInterval: number
  buzzerArmedDoor: boolean
  updatedOn?:string
  createdOn?:string
}
