import { Component } from '@angular/core'
import { NavController, NavParams, ViewController, LoadingController } from 'ionic-angular'
import { AuthService } from '../../app/auth.service'
import { IUserSetting } from '../../app/usersetting.interface'
import { UserSettingStore } from '../../app/usersetting.store'
import { StationsPage } from '../../pages/stations/stations'

@Component({
  selector: 'page-usersettings',
  templateUrl: 'usersettings.html'
})
export class UserSettingsPage {

  userSettings:IUserSetting = {
    userId: '',
    settings: {
      temperatureUnits: "f",
      language: "en-US",
      textPhoneNumber: null,
      notificationEmail: null
    }
  };

  languageSelectOptions = {
    title: '',
    subTitle: 'Select your language'
  };  

  loading;

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    public viewCtrl: ViewController,
    public auth: AuthService,
    public loadingCtrl: LoadingController,
    public userSettingStore: UserSettingStore
  ) {

    this.loading = this.loadingCtrl.create({
      spinner: 'dots',
      content: 'Loading Settings ...'
    });

    this.loading.present();
    

  }

  ionViewDidLoad() {  
    this.getUserSettings();
  }

  getUserSettings() {
    this.userSettingStore.refresh().subscribe(usersettings => {

      if (!usersettings || !usersettings.userId) { 
        console.log("Settings don't exist for this user.");
        this.auth.getCredentials().subscribe(creds => {
          this.auth.cognitoUser['getUserAttributes']((err, results) => {
            if (err) { return console.log('err getting attrs', err) }
            
            for (var x = 0; x <= results.length; x++)
            {
              if (results[x].getName() == 'email')
              {
                this.userSettings.settings.notificationEmail = results[x].getValue();
                break;
              }
            }
          });
        });        
      }
      else
      {
        console.log('loading settings');
        this.userSettings = usersettings;

        this.auth.getCredentials().subscribe(creds => {
          this.auth.cognitoUser['getUserAttributes']((err, results) => {
            if (err) { return console.log('err getting attrs', err) }
            
            for (var x = 0; x <= results.length; x++)
            {
              if (results[x].getName() == 'email')
              {
                this.userSettings.settings.notificationEmail = results[x].getValue();
                break;
              }
            }
          });
        });        
      }
      this.loading.dismiss();
    })
  }    

  editSettings () {    

    this.loading = this.loadingCtrl.create({
      spinner: 'dots',
      content: 'Saving Settings ...'
    });

    this.loading.present();  

    this.userSettings.userId = this.auth.currentIdentity;
    this.userSettingStore.editUserSetting(this.userSettings).subscribe(usersettings => {
      if (usersettings) {
        console.log('Edited usersetting.');
        this.loading.dismiss();
        this.navCtrl.setRoot(StationsPage, {
          fromMenu: false
        });
      } else {
        console.log('Could not edit user setting. Please see logs')
      }
    });

  }
}
