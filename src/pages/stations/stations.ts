import { Component, ViewChildren } from '@angular/core'

import { NavController, NavParams, Platform, Loading, LoadingController } from 'ionic-angular'
import { SafeResourceUrl, DomSanitizer } from '@angular/platform-browser';
import { ToastController } from 'ionic-angular'

import { AuthService } from '../../app/auth.service'
import { StationStore } from '../../app/station.store'
import { SharedStationStore } from '../../app/sharedstation.store'
import { IStation } from '../../app/station.interface'
import { ISharedStation } from '../../app/sharedstation.interface'
import { AddStationPage } from '../addstation/addstation'
import { StationDetailsPage } from '../stationdetails/stationdetails'
import UUID from 'uuid'
import * as moment from 'moment'

@Component({
  selector: 'page-stations',
  templateUrl: 'stations.html'
})
export class StationsPage {

  displayFormat:string = 'YYYY-MM-DD'
  fromMenu = false;
  showHelpVideo = false;

  helpVideo: any = {
        url: 'https://www.youtube.com/embed/3f2cxVWjjI0',
        title: 'SimpleSensor Locations and Setup'
  };   

  trustedHelpVideoUrl: SafeResourceUrl;

  loading;

  @ViewChildren('stationChild') createdStationItems;
  @ViewChildren('sharedStationChild') createdSharedStationItems;

  station:IStation = {
    stationId: UUID.v4(),
    name: null,
    type: null,
    activationCode: UUID.v4(),
    description: null,
    registeredOn: moment().format(this.displayFormat),
    numSensors: 0
  }

  constructor(
    private navCtrl: NavController,
    public navParams: NavParams,
    private toastCtrl: ToastController,
    private loadingCtrl: LoadingController,
    private domSanitizer: DomSanitizer, 
    private auth: AuthService,
    private stationStore: StationStore,
    private sharedStationStore: SharedStationStore,
    public platform: Platform
  ) {  
    this.fromMenu = navParams.get('fromMenu');  
  }

  ionViewDidLoad() {
    console.log('stations ionViewDidLoad');
    this.doRefreshAll();
    
    setTimeout(() => {
      this.doRefreshAll();
    }, 6500); 
      
  }

  doRefresh (refresher) {
    let subscription = this.stationStore.refresh().subscribe({
      complete: () => {
        subscription.unsubscribe()
        refresher.complete()
      }
    })
  }

  doRefreshAll() {
    let subscription = this.stationStore.refresh().subscribe({
      complete: () => {
        subscription.unsubscribe();        
        subscription = this.sharedStationStore.refresh().subscribe({
          complete: () => {
            subscription.unsubscribe();                
            
            var numStations = this.createdStationItems.toArray().length;
            var numSharedStations = this.createdSharedStationItems.toArray().length;
            
            if (numStations == 1 && numSharedStations == 0 && !this.fromMenu)
            {
              console.log('Go to the only station.');
              //console.log(this.createdStationItems.first);
              this.createdStationItems.first.getNativeElement().click();
            }
            else if (numStations == 0 && numSharedStations == 1 && !this.fromMenu)
            {
              console.log('Go to the only shared station.');
              this.createdSharedStationItems.first.getNativeElement().click();
            }
          }
        });            
      }
    });
  }


  deleteStation (index) {
    this.stationStore.deleteStation(index).subscribe(station => {
      if (!station) { return console.log('could not delete station. Please check logs') }

      this.presentToast(`"${station.name}" was deleted.`)
    })
  }

  addStation () {    
    this.station.createdOn = moment(new Date()).format(this.displayFormat)
    this.stationStore.addStation(this.station).subscribe(station => {
      if (station) {
        console.log('Added station. Please see logs')
      } else {
        console.log('Could not add station. Please see logs')
      }
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

  openAddStation() {
    this.navCtrl.setRoot(AddStationPage, {});
  }

  openStationDetails(selectedStationId, stationName, isShared) {    
    this.navCtrl.setRoot(StationDetailsPage, {
      selectedStationId: selectedStationId,
      stationName: stationName,
      isShared: isShared
    });
  }

  async getStationSize() {
    return await this.stationStore.stations.map((stations) => stations.size)
  }

  get size() { return this.stationStore.stations.map((stations) => stations.size) }

  get sharedSize() { return this.sharedStationStore.sharedstations.map((sharedstations) => sharedstations.size) }

  getSensorTitle(num)
  {
    if (num > 1)
    {      
      return "Sensors";
    }
    else if (num == 0)
    {
      return "Sensors - Touch to add a Sensor"
    }
    else 
    {
      return "Sensor"
    }
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
