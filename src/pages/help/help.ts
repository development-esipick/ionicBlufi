import { Component } from '@angular/core'
import { NavController, NavParams, ViewController, Loading, LoadingController } from 'ionic-angular'
import { SafeResourceUrl, DomSanitizer } from '@angular/platform-browser';
import { AuthService } from '../../app/auth.service'
import { CognitoUser , CognitoUserAttribute } from 'amazon-cognito-identity-js'
import { HomePage } from '../home/home';
import { StationsPage } from '../stations/stations';

@Component({
  selector: 'page-help',
  templateUrl: 'help.html'
})
export class HelpPage {

  user: CognitoUser
  attrs: Array<CognitoUserAttribute> = []

  showRegVideo = false;
  showAddSensorVideo = false;
  showNotificationsAndSettingsVideo = false;
  showAlertsVideo = false;
  showDetailsVideo = false;
  showSubscriptionsVideo = false;
  showWifiVideo = false;
  showAccountDeletion = false;

  regVideo: any = {
        url: 'https://www.youtube.com/embed/h0g9b3IIZn0',
        title: 'SimpleSensor Setup'
  };  

  trustedRegVideoUrl: SafeResourceUrl;

  addSensorVideo: any = {
        url: 'https://www.youtube.com/embed/DmxU6wkEL50?list=PLh12Jh0K061eDe4tmjozU22QKvmq6d-ac',
        title: 'SimpleSensor Setup'
  };  

  trustedAddSensorVideoUrl: SafeResourceUrl;

  notificationsAndSettingsVideo: any = {
        url: 'https://www.youtube.com/embed/XEMpTKcI5gE',
        title: 'SimpleSensor Notifications'
  };  

  trustedNotificationsAndSettingsVideoUrl: SafeResourceUrl;  

  alertsVideo: any = {
        url: 'https://www.youtube.com/embed/XEMpTKcI5gE',
        title: 'SimpleSensor Alerts'
  };  

  trustedAlertsVideoUrl: SafeResourceUrl;    

  detailsVideo: any = {
        url: 'https://www.youtube.com/embed/eWHYJotPdkM',
        title: 'SimpleSensor Sensor Details'
  };  

  trustedDetailsVideoUrl: SafeResourceUrl;  

  subscriptionsVideo: any = {
        url: 'https://www.youtube.com/embed/3f2cxVWjjI0',
        title: 'SimpleSensor Subscriptions'
  };  

  trustedSubscriptionsVideoUrl: SafeResourceUrl;  

  wifiVideo: any = {
        url: 'https://www.youtube.com/embed/3f2cxVWjjI0',
        title: 'SimpleSensor Wifi'
  };  

  trustedWifiVideoUrl: SafeResourceUrl; 

  loading: Loading; 

  constructor(
    public navCtrl: NavController, 
    public navParams: NavParams, 
    public viewCtrl: ViewController, 
    public auth: AuthService, 
    private domSanitizer: DomSanitizer, 
    public loadingCtrl: LoadingController
    ) 
  {

  }

  ionViewDidLoad() {

  }

  loadRegVideo() {
    this.showRegVideo = true;

    this.trustedRegVideoUrl = this.domSanitizer.bypassSecurityTrustResourceUrl(this.regVideo.url);

    this.loading = this.loadingCtrl.create({
      content: 'Loading Video ...'
    });

    this.loading.present();  
  }  

  loadAddSensorVideo() {
    this.showAddSensorVideo = true;

    this.trustedAddSensorVideoUrl = this.domSanitizer.bypassSecurityTrustResourceUrl(this.addSensorVideo.url);

    this.loading = this.loadingCtrl.create({
      content: 'Loading Video ...'
    });

    this.loading.present();  
  }    

  loadNotificationsAndSettingsVideo() {
    this.showNotificationsAndSettingsVideo = true;

    this.trustedNotificationsAndSettingsVideoUrl = this.domSanitizer.bypassSecurityTrustResourceUrl(this.notificationsAndSettingsVideo.url);

    this.loading = this.loadingCtrl.create({
      content: 'Loading Video ...'
    });

    this.loading.present();  
  }    

  loadAlertsVideo() {
    this.showAlertsVideo = true;

    this.trustedAlertsVideoUrl = this.domSanitizer.bypassSecurityTrustResourceUrl(this.alertsVideo.url);

    this.loading = this.loadingCtrl.create({
      content: 'Loading Video ...'
    });

    this.loading.present();  
  }  

  loadDetailsVideo() {
    this.showDetailsVideo = true;

    this.trustedDetailsVideoUrl = this.domSanitizer.bypassSecurityTrustResourceUrl(this.detailsVideo.url);

    this.loading = this.loadingCtrl.create({
      content: 'Loading Video ...'
    });

    this.loading.present();  
  }    

  loadSubscriptionsVideo() {
    this.showSubscriptionsVideo = true;

    this.trustedSubscriptionsVideoUrl = this.domSanitizer.bypassSecurityTrustResourceUrl(this.subscriptionsVideo.url);

    this.loading = this.loadingCtrl.create({
      content: 'Loading Video ...'
    });

    this.loading.present();  
  }

  loadAccountDeletion() {
    this.showAccountDeletion = true;
  }

  loadWifiVideo() {
    this.showWifiVideo = true;

    this.trustedWifiVideoUrl = this.domSanitizer.bypassSecurityTrustResourceUrl(this.wifiVideo.url);

    this.loading = this.loadingCtrl.create({
      content: 'Loading Video ...'
    });

    this.loading.present();  
  }

  handleIFrameLoadEvent(): void {
    this.loading.dismiss();
  }    

  openStations() {
    this.navCtrl.setRoot(StationsPage);
  }
}
