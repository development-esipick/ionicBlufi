export interface ISensorEvent {
  sensorId?:string
  eventId: string
  userId:string
  stationId:string
  eventKeyword: string
  eventDescription: string
  eventDuration: number
  eventDateTime?:string
  ttl: number
}
