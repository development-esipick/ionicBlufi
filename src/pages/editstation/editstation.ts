import { Component } from '@angular/core'
import { NavController, NavParams, ViewController, Platform, LoadingController, AlertController } from 'ionic-angular'
import { AuthService } from '../../app/auth.service'
import { IStation } from '../../app/station.interface'
import { IUserSetting } from '../../app/usersetting.interface'
import { ISharedStation } from '../../app/sharedstation.interface'
import { IStationSetting } from '../../app/stationsetting.interface'
import { SharedStationStore } from '../../app/sharedstation.store'
import { StationStore } from '../../app/station.store'
import { StationSettingStore } from '../../app/stationsetting.store'
import { UserSettingStore } from '../../app/usersetting.store'
import { StationDetailsPage } from '../stationdetails/stationdetails'
import { StationsPage } from '../stations/stations'
import { Contacts, Contact } from '@ionic-native/contacts';
import * as moment from 'moment'

@Component({
  selector: 'page-editstation',
  templateUrl: 'editstation.html'
})
export class EditStationPage {

  selectedStationId = '';
  selectedStationName = '';
  isShared = false;

  stationSharedWith;

  loading;

  displayFormat:string = 'YYYY-MM-DD'
  station:IStation = {
    stationId:null,
    name:null,
    type:null,
    activationCode:null,
    createdOn:null,
    registeredOn:null,
    description:null,
    numSensors:null
  };

  sharedStation:ISharedStation = {
    stationId:null,
    sharedStationId:null,
    stationName:null,
    ownerId:null,
    ownerEmail:null,
    shareeId:null,
    shareeEmail:null,
    updatedOn:null,
    createdOn:null  
  };  

  stationSettings:IStationSetting = {
    userId: '',
    stationId: this.selectedStationId,
    settings: {
      myLocationPushNotification: true,
      myLocationTextNotification: false,
      myLocationEmailNotification: false,
      myLocationVoiceNotification: false
    }
  };  

  userSettings:IUserSetting = {
    userId: '',
    settings: {
      temperatureUnits: "f",
      language: "en-US",
      textPhoneNumber: null,
      notificationEmail: null
    },
    hasSubscription: false
  };  

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    public viewCtrl: ViewController,
    public auth: AuthService,
    private stationStore: StationStore,
    private sharedStationStore: SharedStationStore,
    private stationSettingStore: StationSettingStore,
    public userSettingStore: UserSettingStore,
    public contacts: Contacts,
    public platform: Platform,
    public loadingCtrl: LoadingController,
    private alertCtrl: AlertController
  ) {

    this.selectedStationId = navParams.get('selectedStationId');
    this.selectedStationName = navParams.get('selectedStationName');
    this.isShared = navParams.get('isShared');
    
  }

  ionViewDidLoad() {

    this.loading = this.loadingCtrl.create({
      spinner: 'dots',
      content: 'Loading Location Settings ...',
      duration: 3000
    });

    this.loading.present();

    this.getStationDetails();
    this.getStationSettings();
    this.getStationSharedWith();
    this.getUserSettings();
  }

  pickSharee() {
    this.contacts.pickContact()
      .then((response: Contact) => { 
         //console.log(response);
         console.log(response.emails[0].value);
         this.sharedStation.shareeEmail = response.emails[0].value;
      });
  }

  getUserSettings() {
    this.userSettingStore.refresh().subscribe(usersettings => {

      if (!usersettings || !usersettings.userId) { 
        console.log("Settings don't exist for this user.");
      }
      else
      {
        console.log('loading settings');
        this.userSettings = usersettings;
        
      }      
    });
  }      

  getStationDetails() {
    this.stationStore.refreshSelectedStation(this.selectedStationId).subscribe(station => {
      if (!station) { 
        console.log('Could not get station details. Please check logs');
      }
      else
      { 
        this.station = station;
      }
    });
  }

  getStationSettings() {
    this.stationSettingStore.refreshSelectedStationSettings(this.selectedStationId).subscribe(stationsettings => {

      if (!stationsettings || !stationsettings.userId) { 
        console.log("Settings don't exist for this station.");
      }
      else
      {
        console.log('loading settings');
        this.stationSettings = stationsettings;
      }      
    });
  }    

  getStationSharedWith() {
    this.sharedStationStore.refreshSharedInfoForStation(this.selectedStationId).subscribe(sharedstations => {
      if (!sharedstations) { 
        console.log('Could not get sharedstation details. Please check logs');
      }
      else
      {        
        this.stationSharedWith = sharedstations;
      }    
    });
  }  

  shareStation() {

    if (this.sharedStation.shareeEmail)
    {    
      var rDate = new Date();
      this.sharedStation.stationId = this.station.stationId;
      this.sharedStation.sharedStationId = rDate.getTime().toString();
      this.sharedStation.stationName = this.station.name;
      this.sharedStation.ownerId = this.auth.currentIdentity;    
      this.sharedStation.updatedOn = rDate.toISOString();
      this.sharedStation.createdOn = rDate.toISOString();

      //get email address of logged in user
      this.auth.getCredentials().subscribe(creds => {
        this.auth.cognitoUser['getUserAttributes']((err, results) => {
          if (err) { return console.log('err getting attrs', err) }
          for (var x = 0; x < results.length; x++)
          {          
            if (results[x].getName() === 'email')
            {
              this.sharedStation.ownerEmail = results[x].getValue();
              console.log(JSON.stringify(this.sharedStation));
              //save this - the server-side will lookup the shareeId if there is one and send an invitation
              this.sharedStationStore.addSharedStation(this.sharedStation).subscribe(sharedstation => {
                if (sharedstation)
                {
                  console.log('Station shared.');
                  this.getStationSharedWith();
                  this.sharedStation.shareeEmail = null;
                }
              })
            }
          }
        })
      });
    }
  }

  deleteSharedStation(stationid, sharedstationid) {
    console.log('delete share: ' + sharedstationid);
    this.sharedStationStore.deleteSharedStation(stationid, sharedstationid).subscribe(sharedstation => {
      console.log('Station deleted.');
      this.getStationSharedWith();      
    })
  }

  editStation () {    
    
    this.stationStore.editStation(this.station).subscribe(station => {
      if (station) {
        console.log('Edited station.')
        this.navCtrl.setRoot(StationDetailsPage, {
            selectedStationId: station.stationId,
            stationName: station.name, 
            isShared: this.isShared
        });
      } else {
        console.log('Could not edit station. Please see logs')
      }
    })
  }

  saveSettings() {
    this.loading = this.loadingCtrl.create({
      spinner: 'dots',
      content: 'Saving Location Settings ...'
    });

    this.loading.present();  

    this.stationSettings.userId = this.auth.currentIdentity;
    this.stationSettings.stationId = this.selectedStationId;
    this.stationSettingStore.editStationSetting(this.stationSettings).subscribe(stationsettings => {
      if (stationsettings) {
        console.log('Edited stationsetting.');
        this.loading.dismiss();
        this.navCtrl.setRoot(StationDetailsPage, {
            selectedStationId: this.selectedStationId,
            stationName: this.selectedStationName, 
            isShared: this.isShared
        });
      } else {
        this.loading.dismiss();
        console.log('Could not edit station setting. Please see logs')
      }
    });  
  }

  deleteStation()
  {
    //console.log('delete location...');
    if (this.station)
    {
      let alert = this.alertCtrl.create({
        title: 'Confirm Delete',
        message: 'Are you sure you want to delete this location?',
        buttons: [
          {
            text: 'Cancel',
            role: 'cancel',
            handler: () => {
              console.log('Cancel clicked');
            }
          },
          {
            text: 'Delete',
            handler: () => {
              console.log('Delete clicked');
              this.stationStore.deleteStation(this.station.stationId).subscribe(station => {
                        
                this.navCtrl.setRoot(StationsPage, {
                  fromMenu: true
                });
                
              });              
            }
          }
        ]
      });
      alert.present();
    }
  }    
}
