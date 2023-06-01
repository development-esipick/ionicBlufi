import { Component } from '@angular/core'
import { NavController, NavParams, ViewController, Platform } from 'ionic-angular'
import { AuthService } from '../../app/auth.service'
import { CognitoUser , CognitoUserAttribute } from 'amazon-cognito-identity-js'
import { HomePage } from '../home/home';
import { StationsPage } from '../stations/stations';
import { AppVersion } from '@ionic-native/app-version';

@Component({
  selector: 'page-about',
  templateUrl: 'about.html'
})
export class AboutPage {

  user: CognitoUser
  attrs: Array<CognitoUserAttribute> = []

  appVersionNumber = null;

  constructor(public platform: Platform, public navCtrl: NavController, public navParams: NavParams, public viewCtrl: ViewController, public auth: AuthService, private appVersion: AppVersion) {

  }

  setAppVersion() {
    let self = this;
    if (this.platform.is('cordova')) {
        this.appVersion.getVersionNumber().then(function (version) {        
          console.log('received app version: ' + version);
          self.appVersionNumber = version;
        });
    }
    else {
      this.appVersionNumber = 'Available in App';
    }
  }

  ionViewDidLoad() {
    this.auth.getCredentials().subscribe(creds => {
      this.auth.cognitoUser['getUserAttributes']((err, results) => {
        if (err) { return console.log('err getting attrs', err) }
        this.attrs = results
      })
    });

    this.setAppVersion();
  }

  signout () {
     this.auth.signout()
     this.dismiss()
  }

  dismiss() { this.navCtrl.setRoot(HomePage) }

  openStations() {
    this.navCtrl.setRoot(StationsPage);
  }
}
