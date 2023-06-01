export interface IStationSetting {
  userId:string
  stationId:string
  settings: {
    myLocationPushNotification: boolean;
    myLocationTextNotification: boolean;
    myLocationEmailNotification: boolean;
    myLocationVoiceNotification: boolean;
  };
}
