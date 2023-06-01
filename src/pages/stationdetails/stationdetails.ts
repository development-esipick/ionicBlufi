import { Component } from '@angular/core'

import { NavController, NavParams, Platform, Loading, LoadingController } from 'ionic-angular'
import { SafeResourceUrl, DomSanitizer } from '@angular/platform-browser';
import { ToastController } from 'ionic-angular'

import { AuthService } from '../../app/auth.service'
import { SensorStore } from '../../app/sensor.store'
import { ISensor } from '../../app/sensor.interface'
import { AddSensorPage } from '../addsensor/addsensor'
import { SensorDetailsPage } from '../sensordetails/sensordetails'
import { EditStationPage } from '../editstation/editstation'
import UUID from 'uuid'
import * as moment from 'moment'

@Component({
  selector: 'page-stationdetails',
  templateUrl: 'stationdetails.html'
})
export class StationDetailsPage {

  displayFormat:string = 'YYYY-MM-DD'
  sensor:ISensor = {
    sensorId: UUID.v4(),
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

  showHelpVideo = false;

  testedSensorLength = false;

  helpVideo: any = {
        url: 'https://www.youtube.com/embed/eWHYJotPdkM',
        title: 'SimpleSensor Details'
  };   

  trustedHelpVideoUrl: SafeResourceUrl;

  loading;
  selectedStationId = '';
  stationName = '';
  detailTimer;
  isShared = false

  stationsLoaded = false;

  constructor(
    private navCtrl: NavController,
    public navParams: NavParams,
    private toastCtrl: ToastController,
    private loadingCtrl: LoadingController,
    private domSanitizer: DomSanitizer,     
    private auth: AuthService,
    private sensorStore: SensorStore,
    public platform: Platform
  ) {
    
    this.selectedStationId = navParams.get('selectedStationId');
    this.stationName = navParams.get('stationName');
    this.isShared = navParams.get('isShared');
    
  }

  ionViewDidLoad() {
    
  }

  ionViewDidEnter() {
    this.doRefreshie();
    this.detailTimer = setInterval(() => this.doRefreshie(), 5 * 1000);
  }

  ionViewDidLeave() {
    console.log('Left station details view');
    clearInterval(this.detailTimer);
  }  

  doRefresh (refresher) {
    let subscription = this.sensorStore.refresh().subscribe({
      complete: () => {
        subscription.unsubscribe()
        refresher.complete()
        this.stationsLoaded = true;
      }
    })
  }

  doRefreshie () {
    let self = this;
    let subscription = this.sensorStore.refreshSensorsForStation(this.selectedStationId).subscribe({
      complete: () => {
        subscription.unsubscribe();
        self.stationsLoaded = true;
        if (!this.testedSensorLength)
        {
          let sSub = this.sensorStore.sensors.subscribe(result => {          
            if (result.size === 0)
            {
              this.openHelpVideo();
            }
            this.testedSensorLength = true;            
            sSub.unsubscribe();
          });        
        }
      }
    });
  }

  deleteSensor (index) {
    this.sensorStore.deleteSensor(index).subscribe(sensor => {
      if (!sensor) { return console.log('could not delete sensor. Please check logs') }

      this.presentToast(`"${sensor.name}" was deleted.`)
    })
  } 

  presentToast(message) {
    let toast = this.toastCtrl.create({
      message: message,
      duration: 1500,
      position: 'bottom'
    })
    toast.onDidDismiss(() => { console.log('Dismissed toast') })
    toast.present()
  }

  openAddSensor() {
    this.navCtrl.push(AddSensorPage, {
      selectedStationId: this.selectedStationId
    });
  }

  openSensorDetails(selectedSensorId, sensorName, selectedStationId, selectedSensorType, selectedSensorState) {    
    this.navCtrl.push(SensorDetailsPage, {
      selectedSensorId: selectedSensorId,
      sensorName: sensorName,
      selectedStationId: selectedStationId,
      isShared: this.isShared,
      selectedSensorState: selectedSensorState,
      selectedSensorType: selectedSensorType
    });
  }

  openEditStation()
  {
    this.navCtrl.push(EditStationPage, {
      selectedStationId: this.selectedStationId,
      selectedStationName: this.stationName,
      isShared: this.isShared
    });
  }

  get size() { return this.sensorStore.sensors.map((sensors) => sensors.size) }

  getTimeSinceUpdate(d)
  {
    return (new Date().getTime() - new Date(d).getTime()) / 1000;
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
