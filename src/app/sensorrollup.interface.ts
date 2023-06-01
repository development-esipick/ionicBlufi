export interface ISensorRollup {
  sensorId?:string
  sensorFifteenMinuteRollupId: number
  sensorDataCount: number
  avgLux: number
  minLux: number
  maxLux: number
  stdevLux: number
  avgTemp: number
  minTemp: number
  maxTemp: number
  stdevTemp: number
  avgHumidity: number
  minHumidity: number
  maxHumidity: number
  stdevHumidity: number
  avgAccelx: number
  minAccelx: number
  maxAccelx: number
  stdevAccelx: number
  avgAccely: number
  minAccely: number
  maxAccely: number
  stdevAccely: number
  avgAccelz: number
  minAccelz: number
  maxAccelz: number
  stdevAccelz: number
  ttl: number
}
