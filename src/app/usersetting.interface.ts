export interface IUserSetting {
  userId:string
  settings: {
    temperatureUnits: string;
    language: string; 
    textPhoneNumber: string;
    notificationEmail?: string;
  };
  hasSubscription?: boolean;
  currentSubscriptionId?: string;
  subscriptionReceipts?: string[];
}
