import { Component } from '@angular/core'
import { NavController, NavParams, ViewController, LoadingController } from 'ionic-angular'
import { AuthService } from '../../app/auth.service'
import { ISensorAlert } from '../../app/sensoralert.interface'
import { SensorAlertStore } from '../../app/sensoralert.store'
import { SensorDetailsPage } from '../sensordetails/sensordetails'
import * as moment from 'moment'

@Component({
  selector: 'page-editsensoralerts',
  templateUrl: 'editsensoralerts.html'
})
export class EditSensorAlertsPage {

  selectedSensorId = '';
  selectedSensorName = '';
  selectedSensorType = '';
  isNew = false;

  loading;

  sensoralert:ISensorAlert = {
    sensorId: this.selectedSensorId,
    userId: null,
    temperatureAlertOn: false,
    temperatureAlertMin: 10,
    temperatureAlertMax: 90,
    humidityAlertOn: false,
    humidityAlertMin: 10,
    humidityAlertMax: 90,
    luxAlertOn: false,
    luxAlertMin: 10,
    luxAlertMax: 9000,
    accelAlertOn: false,
    accelxMin: 1,
    accelyMin: 1,
    accelzMin: 1,
    accelxMax: 1,
    accelyMax: 1,
    accelzMax: 1,
    gyroAlertOn: false,
    gyroxMin: 1,
    gyroyMin: 1,
    gyrozMin: 1,
    gyroxMax: 1,
    gyroyMax: 1,
    gyrozMax: 1,
    temperatureAlertState: 'MEDIUM',
    temperatureAlertDate: moment().format(),
    humidityAlertState: 'MEDIUM',
    humidityAlertDate: moment().format(),
    luxAlertState: 'MEDIUM',
    luxAlertDate: moment().format(),
    notifyOnEveryEvent: true,
    notifyOnOpenMinutes: 0,
    buzzerArmedWater: true,
    notifyOnWaterDetection: true,
    sensorInterval: 10,
    buzzerArmedDoor: false,
    updatedOn: moment().format(),
    createdOn: moment().format()
  }

  temperatureAlertRange: any = {
    upper: 90,
    lower: 10
  }  

  humidityAlertRange: any = {
    upper: 90,
    lower: 10
  }  

  brightnessAlertRange: any = {
    upper: 9000,
    lower: 10
  }    

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    public viewCtrl: ViewController,
    public auth: AuthService,
    private sensorAlertStore: SensorAlertStore,
    public loadingCtrl: LoadingController
  ) {

    this.loading = this.loadingCtrl.create({
      spinner: 'dots',
      content: 'Loading Alerts ...'
    });

    this.loading.present();

    this.selectedSensorId = navParams.get('selectedSensorId');
    this.selectedSensorName = navParams.get('sensorName');
    this.selectedSensorType = navParams.get('sensorType');
    this.isNew = navParams.get('isNew');
  }

  ionViewDidLoad() {
    this.getSensorAlertDetails();
  }

  alertsChanged() {
    this.editSensorAlert();
  }

  getSensorAlertDetails() {
    this.sensorAlertStore.refreshSelectedSensorAlert(this.selectedSensorId).subscribe(sensoralert => {
      if (!sensoralert || !sensoralert.sensorId) { 
        console.log("Sensor alerts don't exist for this sensor.") 
      }
      else
      {        
        this.sensoralert = sensoralert;
        this.temperatureAlertRange = {
          lower: sensoralert.temperatureAlertMin,
          upper: sensoralert.temperatureAlertMax
        };

        this.humidityAlertRange = {
          lower: sensoralert.humidityAlertMin,
          upper: sensoralert.humidityAlertMax
        };        

        this.brightnessAlertRange = {
          lower: sensoralert.luxAlertMin,
          upper: sensoralert.luxAlertMax
        };
      }
      this.loading.dismiss();
    })
  }  

  editSensorAlert () {    
    this.sensoralert.updatedOn = moment(new Date()).format();
    this.sensoralert.sensorId = this.selectedSensorId;
    this.sensoralert.temperatureAlertMin = this.temperatureAlertRange.lower;
    this.sensoralert.temperatureAlertMax = this.temperatureAlertRange.upper;
    this.sensoralert.humidityAlertMin = this.humidityAlertRange.lower;
    this.sensoralert.humidityAlertMax = this.humidityAlertRange.upper;
    //this.sensoralert.luxAlertMin = this.brightnessAlertRange.lower;
    //this.sensoralert.luxAlertMax = this.brightnessAlertRange.upper;

    this.sensorAlertStore.editSensorAlert(this.sensoralert).subscribe(sensoralert => {
      if (sensoralert) {
        console.log('Edited sensoralert.')
        if (this.isNew)
        {
          this.navCtrl.setRoot(SensorDetailsPage, {
              selectedSensorId: this.selectedSensorId,
              sensorName: this.selectedSensorName
          });        
        }
        else {
          //just go back
          this.navCtrl.pop();        
        }        
      } else {
        console.log('Could not edit sensor alert. Please see logs')
      }
    })
  }
}
