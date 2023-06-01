export interface ISensorReading {
  sensorId?:string
  sensorReadingId: string
  userId:string
  stationId:string
  stationIP: string
  lux: number
  temp: number
  humidity: number
  accelx: number
  accely: number
  accelz: number
  magnetox: number
  magnetoy: number
  magnetoz: number
  battery: number
  readingDateTime?:string
  ttl: number
  dataMap?:string
}