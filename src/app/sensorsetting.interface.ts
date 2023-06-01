export interface ISensorSetting {
  userId:string
  sensorId:string
  settings: {
    pollingInterval: number;
  };
}
