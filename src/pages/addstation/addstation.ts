import { Component } from '@angular/core'
import { BLE } from '@ionic-native/ble';
import { NavController, NavParams, ViewController, Platform, Loading, LoadingController } from 'ionic-angular'
import { AuthService } from '../../app/auth.service'
import { IStation } from '../../app/station.interface'
import { StationStore } from '../../app/station.store'
import { StationsPage } from '../stations/stations'
import * as moment from 'moment'

@Component({
  selector: 'page-addstation',
  templateUrl: 'addstation.html'
})
export class AddStationPage {

  displayFormat:string = 'YYYY-MM-DD';
  station:IStation = {
    stationId: null,
    name: null,
    type: null,
    description: null,
    activationCode: null,        
    registeredOn: null,
    numSensors: 0
  }

  loading: Loading;  

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    public viewCtrl: ViewController,
    public auth: AuthService,
    public loadingCtrl: LoadingController,
    private stationStore: StationStore,
    public platform: Platform
  ) {
  }

  ionViewDidLoad() {

  }

  ionViewWillEnter(): void {

  }


  addStation () {
    this.station.stationId = this.createUUID();
    this.station.activationCode = '12345';
    this.station.createdOn = moment(new Date()).format(this.displayFormat)
    this.station.registeredOn = moment(new Date()).format(this.displayFormat) 

    //todo verify the stationID and activation code match the device in the dynamodb

    if (this.station.name != '' && this.station.name != null)
    {
      //update the station name and userId in dynamo db for this station
      //send user back to the stations page

      this.stationStore.addStation(this.station).subscribe(station => {
        if (station) {
          console.log('Added station.')
          this.navCtrl.setRoot(StationsPage, {});
        } else {
          console.log('Could not add station. Please see logs')
        }
      })    
    }

  }

  createUUID(){
      var dt = new Date().getTime();
      var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          var r = (dt + Math.random()*16)%16 | 0;
          dt = Math.floor(dt/16);
          return (c=='x' ? r :(r&0x3|0x8)).toString(16);
      });
      return uuid;
  }

  goToHome() {
    this.navCtrl.setRoot(StationsPage, {});
  }  

}
