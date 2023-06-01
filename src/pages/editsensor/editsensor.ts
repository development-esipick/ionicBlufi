import { Component } from '@angular/core'
import { NavController, NavParams, ViewController, LoadingController, AlertController } from 'ionic-angular'
import { AuthService } from '../../app/auth.service'
import { ISensor } from '../../app/sensor.interface'
import { SensorStore } from '../../app/sensor.store'
import { SensorDetailsPage } from '../sensordetails/sensordetails'
import { StationDetailsPage } from '../stationdetails/stationdetails'
import { EditSensorAlertsPage } from '../editsensoralerts/editsensoralerts'
import * as moment from 'moment'

@Component({
  selector: 'page-editsensor',
  templateUrl: 'editsensor.html'
})
export class EditSensorPage {

  selectedSensorId = '';
  selectedSensorName = '';
  selectedStationId = '';

  previousSensorType = '';

  isNew = false;

  loading;

  displayFormat:string = 'YYYY-MM-DD'
  sensor:ISensor = {
    sensorId: null,
    name: null,
    sensorType: null,
    sensorStatus: null,
    batteryLevel: null,
    lastTemperature: null,
    lastHumidity: null,
    lastLux: null,
    lastMagnetox: null,
    lastMagnetoy: null,
    lastMagnetoz: null,    
    userId: null,
    stationId: null,
    updatedOn: moment().format(this.displayFormat),
    createdOn: moment().format(this.displayFormat),
    registeredOn: moment().format(this.displayFormat)
  }

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    public viewCtrl: ViewController,
    public auth: AuthService,
    private sensorStore: SensorStore,
    public loadingCtrl: LoadingController,
    private alertCtrl: AlertController
  ) {

    this.loading = this.loadingCtrl.create({
      spinner: 'dots',
      content: 'Loading Sensor ...'
    });

    this.loading.present();

    this.selectedSensorId = navParams.get('selectedSensorId');
    this.isNew = navParams.get('isNew');
  }

  ionViewDidLoad() {
    this.getSensorDetails();
  }

  getSensorDetails() {
    this.sensorStore.refreshSelectedSensor(this.selectedSensorId).subscribe(sensor => {
      if (!sensor) { 
        console.log('Could not get sensor details. Please check logs') 
      }
      else
      {        
        this.sensor = sensor;
        this.previousSensorType = sensor.sensorType;
        this.selectedStationId = sensor.stationId;
        this.loading.dismiss();
      }
      })
  }

  editSensor () {    

    //this.sensor.updatedOn = moment(new Date()).format(this.displayFormat);

    if (this.previousSensorType != this.sensor.sensorType)
    {
      console.log('SensorType changed, change the sensorStatus');
      if (this.sensor.sensorType == 'Washer' ||
          this.sensor.sensorType == 'Dryer' ||
          this.sensor.sensorType == 'Dishwasher' ||
          this.sensor.sensorType == 'Furnace' ||
          this.sensor.sensorType == 'Sump Pump' ||
          this.sensor.sensorType == 'Vibration' ||
          this.sensor.sensorType == 'Water Heater')
      {
        this.sensor.sensorStatus = 'Not Running';
      }
      else if (this.sensor.sensorType == 'Door' ||
               this.sensor.sensorType == 'Beverage Fridge' ||
               this.sensor.sensorType == 'Cabinet' ||
               this.sensor.sensorType == 'Dairy Cooler' ||
               this.sensor.sensorType == 'Drawer' ||
               this.sensor.sensorType == 'Freezer' ||
               this.sensor.sensorType == 'Garage Door' ||
               this.sensor.sensorType == 'Gun Cabinet' ||
               this.sensor.sensorType == 'Liquor Cabinet' ||
               this.sensor.sensorType == 'Medicine Cabinet' ||
               this.sensor.sensorType == 'Pantry' ||
               this.sensor.sensorType == 'Refrigerator' ||
               this.sensor.sensorType == 'Window')
      {
        this.sensor.sensorStatus = 'Closed';      
      }
      else {
        this.sensor.sensorStatus = 'On';
      }
    }
    
    this.sensorStore.editSensor(this.sensor).subscribe(sensor => {
      if (sensor) {
        console.log('Edited sensor.')
        if (!this.isNew)
        {
          this.navCtrl.setRoot(SensorDetailsPage, {
              selectedSensorId: sensor.sensorId,
              sensorName: sensor.name
          });        
        }
        else {
          this.navCtrl.push(EditSensorAlertsPage, {
            selectedSensorId: sensor.sensorId,
            sensorName: sensor.name,
            sensorType: sensor.sensorType,
            isNew: true
          });          
        }
      } else {
        console.log('Could not edit sensor. Please see logs')
      }
    })
  }

  onSensorTypeChange() {
    console.log('Sensor type changed, changing name.')
    this.sensor.name = this.sensor.sensorType;
  }

  deleteSensor()
  {
    //console.log('delete sensor...');
    if (this.sensor)
    {
      let alert = this.alertCtrl.create({
        title: 'Confirm Delete',
        message: 'Are you sure you want to delete this sensor? If so, you will need to press the hard reset button on the sensor in order to set it up again.',
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
              this.sensorStore.deleteSensor(this.selectedSensorId).subscribe(sensor => {
                        
                this.navCtrl.setRoot(StationDetailsPage, {
                    selectedStationId: this.selectedStationId,
                    stationName: '', 
                    isShared: false
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
