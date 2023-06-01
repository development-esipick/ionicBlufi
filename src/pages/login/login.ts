import { Component } from '@angular/core'
import { NavController, NavParams, ViewController, Platform, Loading, LoadingController } from 'ionic-angular'
import { SafeResourceUrl, DomSanitizer } from '@angular/platform-browser';
import { AuthService } from '../../app/auth.service'
import { StationsPage } from '../stations/stations';
import { IStation } from '../../app/station.interface'
import { StationStore } from '../../app/station.store'
import { FacebookLoginPage } from '../facebooklogin/facebooklogin';
import * as moment from 'moment'
import { IUserSNSConfig } from '../../app/usersnsconfig.interface';
import { UserSNSConfigStore } from '../../app/usersnsconfig.store';
import { IUserSetting } from '../../app/usersetting.interface'
import { UserSettingStore } from '../../app/usersetting.store'

import { Push, PushObject, PushOptions } from '@ionic-native/push';

@Component({
  selector: 'page-login',
  templateUrl: 'login.html'
})
export class LoginPage {

  page: string = 'login'
  credentials: Credentials = {}
  message: string
  error: string
  isNewAccount: boolean = false;
  displayFormat:string = 'YYYY-MM-DD';
  showHelpVideo = false;

  helpVideo: any = {
        url: 'https://www.youtube.com/embed/h0g9b3IIZn0',
        title: 'SimpleSensor Create Account'
  };   

  trustedHelpVideoUrl: SafeResourceUrl;

  loading;  

  defaultUserSettings:IUserSetting = {
    userId: '',
    hasSubscription: false,
    settings: {
      temperatureUnits: "f",
      language: "en-US",
      textPhoneNumber: null,
      notificationEmail: null
    }
  };  

  usersnsconfig:IUserSNSConfig = {
    deviceId:null,
    type:null,
    snsArn:null,
    createdOn:moment().format(this.displayFormat)
  }

  station:IStation = {
    stationId: null,
    name: null,
    type: null,
    description: null,
    activationCode: null,        
    registeredOn: null,
    numSensors: 0
  }

  constructor(
    public navCtrl: NavController, 
    public navParams: NavParams, 
    public viewCtrl: ViewController, 
    public auth: AuthService, 
    public platform: Platform, 
    public stationStore: StationStore, 
    public userSettingStore: UserSettingStore,
    private loadingCtrl: LoadingController,
    private domSanitizer: DomSanitizer,     
    public push: Push, 
    public usersnsconfigStore: UserSNSConfigStore) {
    this.page = navParams.get('page');
  }

  ionViewDidLoad() { }

  signin () {
    this.reset();

    this.loading = this.loadingCtrl.create({
      content: 'Signing In ...'
    });

    this.loading.present();    

    this.auth.signin(this.credentials).then((user) => {

      if (this.platform.is('android'))
      {
        this.initGCMPushNotification();
      }      

      if (this.platform.is('ios'))
      {
        this.initAPNSPushNotification();
      }

      this.setDefaultUserSettings();

      if (this.isNewAccount)
      {
        //create a default location
        this.station.stationId = this.createUUID();
        this.station.activationCode = '12345';
        this.station.createdOn = moment(new Date()).format(this.displayFormat)
        this.station.registeredOn = moment(new Date()).format(this.displayFormat) 
        this.station.name = 'Home';

        this.stationStore.addStation(this.station).subscribe(station => {
          if (station) {
            console.log('Added default station.');
            this.loading.dismiss();
            this.navCtrl.setRoot(StationsPage, {});
          } else {
            console.log('Could not add default station. Please see logs');
            this.loading.dismiss();
            this.navCtrl.setRoot(StationsPage);
          }
        });          
      }
      else 
      {
        //they are just logging in
        this.loading.dismiss();
        this.navCtrl.setRoot(StationsPage);
      }      
    }).catch((err) => {
      console.log('error signing in', err)
      this.loading.dismiss();
      this.setError(err.message)
    })
  }

  setDefaultUserSettings() {
    this.userSettingStore.refresh().subscribe(usersettings => {

      if (!usersettings || !usersettings.userId) { 
        console.log("Setting default usersettings...");
        this.auth.getCredentials().subscribe(creds => {
          this.auth.cognitoUser['getUserAttributes']((err, results) => {
            if (err) { return console.log('err getting attrs', err) }
            
            for (var x = 0; x <= results.length; x++)
            {
              if (results[x].getName() == 'email')
              {
                this.defaultUserSettings.settings.notificationEmail = results[x].getValue();
                this.defaultUserSettings.userId = this.auth.currentIdentity;
                this.userSettingStore.editUserSetting(this.defaultUserSettings).subscribe(usersettings => {
                  if (usersettings) {
                    console.log('set default usersetting.');
                  } else {
                    console.log('Could not set default user setting. Please see logs');
                  }
                });                
                break;
              }
            }
          });
        });        
      }
    });
  }      

  initAPNSPushNotification() {

     var push = this.push.init({
          ios: {
              alert: "true",
              badge: "true",
              sound: "true"
          }
      });

    push.on('registration').subscribe((data: any) => {
      //alert('Registration Done: ' + JSON.stringify(data));
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
          //alert('Added usersnsconfig.')          
        } else {
          console.log('Could not add usersnsconfig. Please see logs')
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

  register () {
    this.reset();

    this.auth.register(this.credentials).then((user) => {
      console.log('register: success', user)
      this.page = 'confirm'
    }).catch((err) => {
      console.log('error registering', err)
      this.setError(err.message)
    })
  }

  confirm () {
    this.reset();
    this.auth.confirm(this.credentials).then((user) => {
      this.page = 'login';
      this.setMessage('You have been confirmed. Please login.');
      this.isNewAccount = true;
    }).catch((err) => {
      console.log('error confirming', err)
      this.setError(err.message)
    })
  }

  forgotPassword() {
    this.reset();
    this.auth.forgotPassword(this.credentials.username).then((user) => {
      this.page = 'resetPassword';

    }).catch((err) => {
      console.log('error forgetting password', err)
      this.setError(err.message)
    })    
  }

  resetPassword() {
    this.reset();
    this.auth.resetForgotPassword(this.credentials.username, this.credentials.confcode, this.credentials.password).then(() => {
      this.page = 'login';
      this.credentials.confcode = '';
      this.credentials.password = '';

    }).catch((err) => {
      console.log('error resetting forgot password', err)
      this.setError(err.message)
    })        
  }

  private setMessage(msg) {
     this.message = msg
     this.error = null
  }

  private setError(msg) {
     this.error = msg
     this.message = null
  }

  dismiss () { this.viewCtrl.dismiss() }

  reset () { this.error = null; this.message = null; }

  showConfirmation () { this.page = 'confirm' }
  showRegistration () { this.page = 'register' }
  showLogin () { this.page = 'login'}
  showForgotPassword () { this.page = 'forgotPassword' }
  showFacebookLogin () { this.navCtrl.setRoot(FacebookLoginPage) }

  createUUID(){
      var dt = new Date().getTime();
      var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          var r = (dt + Math.random()*16)%16 | 0;
          dt = Math.floor(dt/16);
          return (c=='x' ? r :(r&0x3|0x8)).toString(16);
      });
      return uuid;
  }

  goTaC() {
    console.log('opening system browser');
    window.open('https://simplesensor.io/pages/terms-conditions', '_system');
    console.log('opened system browser');
  }

  openHelpVideo() {
    this.showHelpVideo = true;

    this.trustedHelpVideoUrl = this.domSanitizer.bypassSecurityTrustResourceUrl(this.helpVideo.url);

    this.loading = this.loadingCtrl.create({
      content: 'Loading Video ...'
    });

    this.loading.present();  
  }      
  
  handleIFrameLoadEvent(): void {
    this.loading.dismiss();
  }        
}

interface Credentials {
  username?: string
  email?: string
  password?: string
  confcode?: string
}
