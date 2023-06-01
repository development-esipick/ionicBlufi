import { NgModule, ErrorHandler } from '@angular/core'
import { BrowserModule } from '@angular/platform-browser'
import { HttpModule } from '@angular/http'
import { Http } from '@angular/http'
import { IonicApp, IonicModule, IonicErrorHandler } from 'ionic-angular'
import { IonicStorageModule } from '@ionic/storage';
import { StatusBar } from '@ionic-native/status-bar'
import { SplashScreen } from '@ionic-native/splash-screen'
import { BLE } from '@ionic-native/ble';
import { FormsModule } from '@angular/forms'
import { Push } from '@ionic-native/push';
import { Facebook } from '@ionic-native/facebook';
import { Vibration } from '@ionic-native/vibration/ngx';
import { NFC, Ndef } from '@ionic-native/nfc/ngx';
import { InAppPurchase2 } from '@ionic-native/in-app-purchase-2';
import { Geolocation } from '@ionic-native/geolocation';

import { MyApp } from './app.component'

import { HomePage } from '../pages/home/home'
import { LoginPage } from '../pages/login/login'
import { FacebookLoginPage } from '../pages/facebooklogin/facebooklogin'
import { LogoutPage } from '../pages/logout/logout'
import { AboutPage } from '../pages/about/about'
import { HelpPage } from '../pages/help/help'
import { StationsPage } from '../pages/stations/stations'
import { SubscriptionsPage } from '../pages/subscriptions/subscriptions'
import { StationDetailsPage } from '../pages/stationdetails/stationdetails'
import { SensorDetailsPage } from '../pages/sensordetails/sensordetails'
import { AddStationPage } from '../pages/addstation/addstation'
import { AddSensorPage } from '../pages/addsensor/addsensor'
import { EditSensorPage } from '../pages/editsensor/editsensor'
import { EditStationPage } from '../pages/editstation/editstation'
import { UserSettingsPage } from '../pages/usersettings/usersettings'
import { EditSensorAlertsPage } from '../pages/editsensoralerts/editsensoralerts'
import { CommunityPage } from '../pages/community/community'
import { IFTTTPage } from '../pages/ifttt/ifttt'
import { Splash } from '../pages/splash/splash';

import { I18nDemoModule } from '../pages/i18n-demo/i18n-demo.module';
import { TranslateModule } from 'ng2-translate/ng2-translate';
import { TranslateLoader, TranslateStaticLoader } from 'ng2-translate/src/translate.service';
import { Globalization } from '@ionic-native/globalization';
import { AppVersion } from '@ionic-native/app-version';

import { AwsConfig } from './app.config'
import { AuthService, AuthServiceProvider } from './auth.service'
import { Sigv4Http, Sigv4HttpProvider } from './sigv4.service'
import { StationStore, StationStoreProvider } from './station.store'
import { SharedStationStore, SharedStationStoreProvider } from './sharedstation.store'
import { SensorStore, SensorStoreProvider } from './sensor.store'
import { SensorAlertStore, SensorAlertStoreProvider } from './sensoralert.store'
import { SensorEventStore, SensorEventStoreProvider } from './sensorevent.store'
import { SensorReadingStore, SensorReadingStoreProvider } from './sensorreading.store'
import { RawSensorDataStore, RawSensorDataStoreProvider } from './rawsensordata.store'
import { SensorRollupStore, SensorRollupStoreProvider } from './sensorrollup.store'
import { UserSNSConfigStore, UserSNSConfigStoreProvider } from './usersnsconfig.store'
import { UserSettingStore, UserSettingStoreProvider } from './usersetting.store'
import { StationSettingStore, StationSettingStoreProvider } from './stationsetting.store'

import { ChartsModule } from 'ng2-charts'
import { Contacts } from '@ionic-native/contacts';
import { momentFromNowPipe } from './momentFromNow.pipe'

import { InternationalPhoneNumberModule } from 'ngx-international-phone-number';

export function createTranslateLoader(http: Http) {
    return new TranslateStaticLoader(http, 'assets/i18n', '.json');
}

@NgModule({
  declarations: [
    MyApp,
    HomePage,
    LoginPage,
    FacebookLoginPage,
    LogoutPage,
    AboutPage,
    HelpPage,
    CommunityPage,
    IFTTTPage,
    StationsPage,
    StationDetailsPage,
    SensorDetailsPage,
    AddStationPage,
    AddSensorPage,
    EditSensorPage,
    EditStationPage,
    EditSensorAlertsPage,    
    UserSettingsPage,
    SubscriptionsPage,
    momentFromNowPipe,
    Splash
  ],
  imports: [
    HttpModule,
    BrowserModule,
    IonicModule.forRoot(MyApp, new AwsConfig().load()),
    FormsModule,
    ChartsModule,
    TranslateModule.forRoot({
            provide: TranslateLoader,
            useFactory: (createTranslateLoader),
            deps: [Http]
        }),
    IonicStorageModule.forRoot(),
    I18nDemoModule,
    InternationalPhoneNumberModule
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
    HomePage,    
    LoginPage,
    FacebookLoginPage,
    LogoutPage,
    AboutPage,
    HelpPage,
    CommunityPage,
    IFTTTPage,
    StationsPage,
    StationDetailsPage,
    SensorDetailsPage,
    SubscriptionsPage,
    AddStationPage,
    AddSensorPage,
    EditSensorPage,
    EditStationPage,
    EditSensorAlertsPage,  
    UserSettingsPage,  
    Splash
  ],
  providers: [
    StatusBar,
    SplashScreen,
    Push,
    Facebook,
    Vibration,
    NFC,
    Ndef,
    Geolocation,
    Contacts,
    InAppPurchase2,
    BLE,
    Globalization,
    AppVersion,
    {provide: ErrorHandler, useClass: IonicErrorHandler},
    AuthService, AuthServiceProvider,
    StationStore, StationStoreProvider,
    SharedStationStore, SharedStationStoreProvider,
    SensorStore, SensorStoreProvider,
    SensorAlertStore, SensorAlertStoreProvider,
    SensorEventStore, SensorEventStoreProvider,
    SensorReadingStore, SensorReadingStoreProvider,
    RawSensorDataStore, RawSensorDataStoreProvider,
    SensorRollupStore, SensorRollupStoreProvider,
    Sigv4Http, Sigv4HttpProvider,
    UserSNSConfigStore, UserSNSConfigStoreProvider,
    UserSettingStore, UserSettingStoreProvider,
    StationSettingStore, StationSettingStoreProvider
  ]
})
export class AppModule {}
