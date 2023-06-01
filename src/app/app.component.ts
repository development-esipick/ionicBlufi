import { Component, ViewChild } from '@angular/core';
import { Platform, Nav, AlertController, ModalController } from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import { AuthService } from './auth.service'

import { HomePage } from '../pages/home/home';
import { Splash } from '../pages/splash/splash';
import { LoginPage } from '../pages/login/login';
import { LogoutPage } from '../pages/logout/logout';
import { UserSettingsPage } from '../pages/usersettings/usersettings';
import { AboutPage } from '../pages/about/about';
import { HelpPage } from '../pages/help/help';
import { IFTTTPage } from '../pages/ifttt/ifttt';
import { StationsPage } from '../pages/stations/stations';
import { SubscriptionsPage } from '../pages/subscriptions/subscriptions';
import { I18nDemoPage } from '../pages/i18n-demo/i18n-demo.page';
import { IUserSNSConfig } from './usersnsconfig.interface';
import { UserSNSConfigStore } from './usersnsconfig.store';

import { Push, PushObject, PushOptions } from '@ionic-native/push';

import { Geolocation } from '@ionic-native/geolocation';

import * as moment from 'moment';


@Component({
  templateUrl: 'app.html'
})
export class MyApp {

  @ViewChild(Nav) nav: Nav;

  rootPage: any = HomePage;

  pages: Array<{title: string, component: any, signInReq: boolean}>;

  displayFormat:string = 'YYYY-MM-DD';
  usersnsconfig:IUserSNSConfig = {
    deviceId:null,
    type:null,
    snsArn:null,
    createdOn:moment().format(this.displayFormat)
  }

  constructor(platform: Platform, statusBar: StatusBar, splashScreen: SplashScreen, public auth: AuthService, public push: Push, public alertCtrl: AlertController, public usersnsconfigStore: UserSNSConfigStore, modalCtrl: ModalController, private geolocation: Geolocation) {

    // used for an example of ngFor and navigation
    this.pages = [
      { title: 'Home', component: HomePage, signInReq: false },
      { title: 'Register or Sign In', component: LoginPage, signInReq: false }
    ];

    platform.ready().then(() => {
      // Okay, so the platform is ready and our plugins are available.
      // Here you can do any higher level native things you might need.
      statusBar.styleDefault();

      if (platform.is('android'))
      {        
        this.initGCMPushNotification();
      }      

      if (platform.is('ios'))
      {
        this.initAPNSPushNotification();
      }

      //splashScreen.hide();

      let splash = modalCtrl.create(Splash);
      splash.present();      

      if (auth.isUserSignedIn())
      {
        this.openStationsPage(false);
      }

      this.geolocation.getCurrentPosition().then((resp) => {
       console.log('Lat: ' + resp.coords.latitude);
       console.log('Long: ' + resp.coords.longitude);
      }).catch((error) => {
        console.log('Error getting location', error);
      });      

    });
  }

  initAPNSPushNotification() {
     console.log('initializing APNS Push Notifications...');
     var push = this.push.init({
          ios: {
              alert: "true",
              badge: "true",
              sound: "true"
          }
      });

    push.on('registration').subscribe((data: any) => {
      //alert('Registration Done: ' + JSON.stringify(data));
      console.log(JSON.stringify(data));
      console.log(data.registrationId.bytes);
      console.log(data.registrationType);
      this.usersnsconfig.deviceId = data.registrationId;
      this.usersnsconfig.type = 'APNS';
      this.usersnsconfig.createdOn = moment().format(this.displayFormat);
      this.usersnsconfigStore.addUserSNSConfig(this.usersnsconfig).subscribe(usersnsconfig => {
        if (usersnsconfig) {
          console.log('Added usersnsconfig.')          
        } else {
          console.log('Could not add usersnsconfig. Please see logs')
        }
      })          

    });    
    push.on('notification').subscribe((data: any) => {
      console.log('Notification Received' + JSON.stringify(data));
      alert(data.message);
    });

    push.on('error').subscribe(error => {
      console.error('Error with Push plugin', error);
    }); 

  }

  initGCMPushNotification(){
    console.log("initGCMPushNotifications");
    const options: PushOptions = {
      android: {
        senderID: "777228507951"
      }
    };
    const pushObject: PushObject = this.push.init(options);  

    pushObject.on('registration').subscribe((data: any) => {
      console.log("device token:", data.registrationId);
      //alert('Event=registration, registrationId=' + data.registrationId);

      this.usersnsconfig.deviceId = data.registrationId;
      this.usersnsconfig.type = 'GCM';
      this.usersnsconfig.createdOn = moment().format(this.displayFormat);
      this.usersnsconfigStore.addUserSNSConfig(this.usersnsconfig).subscribe(usersnsconfig => {
        if (usersnsconfig) {
          console.log('Added usersnsconfig.');
        } else {
          console.log('Could not add usersnsconfig. Please see logs');
        }
      })          

    });

    pushObject.on('notification').subscribe((data: any) => {
      //alert('Notification Received' + JSON.stringify(data));
      alert(data.additionalData.default);
    });

    pushObject.on('error').subscribe(error => {
      console.error('Error with Push plugin', error);
    });
  }    

  openPage(page) {
    // Reset the content nav to have just this page
    // we wouldn't want the back button to show in this scenario
    this.nav.setRoot(page.component);
  }

  openHomePage() {
    // Reset the content nav to have just this page
    // we wouldn't want the back button to show in this scenario
    this.nav.setRoot(HomePage);
  }      

  openI18nDemoPage() {
    // Reset the content nav to have just this page
    // we wouldn't want the back button to show in this scenario
    this.nav.setRoot(I18nDemoPage);
  }      

  openStationsPage(fromMenu) {
    this.nav.setRoot(StationsPage, {
      fromMenu: fromMenu
    });
  }

  openSignInPage() {
    // Reset the content nav to have just this page
    // we wouldn't want the back button to show in this scenario
    this.nav.setRoot(LoginPage, {
      page: 'login'
    });
  }      

  openSettingsPage() {
    this.nav.setRoot(UserSettingsPage, {
      page: 'login'
    });  
  }

  openSubscriptionsPage() {
    this.nav.setRoot(SubscriptionsPage);
  }

  openSignOutPage() {
    this.nav.setRoot(LogoutPage);
  }

  openAboutPage() {
    this.nav.setRoot(AboutPage);  
  }

  openHelpPage() {
    this.nav.setRoot(HelpPage);
  }

  openIFTTTPage() {
    this.nav.setRoot(IFTTTPage);
  }
 
}
