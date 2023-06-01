import { Component } from '@angular/core'

import { NavController, NavParams, Loading, LoadingController } from 'ionic-angular'
import { SafeResourceUrl, DomSanitizer } from '@angular/platform-browser';
import { ToastController } from 'ionic-angular'

import { AuthService } from '../../app/auth.service'
import { SensorStore } from '../../app/sensor.store'
import { SensorAlertStore } from '../../app/sensoralert.store'
import { ISensor } from '../../app/sensor.interface'
import { RawSensorDataStore } from '../../app/rawsensordata.store'
import { IRawSensorData } from '../../app/rawsensordata.interface'
import { SensorEventStore } from '../../app/sensorevent.store'
import { ISensorEvent } from '../../app/sensorevent.interface'
import { SensorReadingStore } from '../../app/sensorreading.store'
import { ISensorReading } from '../../app/sensorreading.interface'
import { IUserSetting } from '../../app/usersetting.interface'
import { UserSettingStore } from '../../app/usersetting.store'
import { EditSensorPage } from '../editsensor/editsensor'
import { CommunityPage } from '../community/community'
import { SubscriptionsPage } from '../subscriptions/subscriptions'
import { EditSensorAlertsPage } from '../editsensoralerts/editsensoralerts'
import { SensorRollupStore } from '../../app/sensorrollup.store'
import { ISensorRollup } from '../../app/sensorrollup.interface'
import UUID from 'uuid'
import * as moment from 'moment'

@Component({
  selector: 'page-sensordetails',
  templateUrl: 'sensordetails.html'
})

export class SensorDetailsPage {

  sensorError: string

  showSensorDetailsVideo = false;
  displayFormat:string = 'YYYY-MM-DD'
  rawDisplayFormat:string = 'MM-DD-YY HH:mm:ss'

  sensorDetailsVideo: any = {
        url: 'https://www.youtube.com/embed/eWHYJotPdkM',
        title: 'SimpleSensor Details'
  };  

  trustedSensorDetailsVideoUrl: SafeResourceUrl;   

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

  selectedSensorId = '';
  selectedStationId = '';
  isShared = false;
  sensorName = '';
  infoView = 'details';
  timeLength = '1d';
  detailTimer;
  sensorState = '';

  loading;

  secondsSinceLastUpdate = 0;

  waterDetected = false;

  helperText = '';

  public temperatureChartData:any[]
  public temperatureChartLabels:any[]
  public temperatureChartLegend:boolean = true
  public temperatureChartType:string = 'line'
  public temperatureChartOptions:any = {
    responsive: true,
    chartArea: {
      backgroundColor: '#333'
    },
    scales: {
      yAxes: [
        { id: 'y-axis-1', type: 'linear', display: true, position: 'left', gridLines: { display: false } }],
      xAxes: [{ display: false, gridLines: { display: false } }]
    }
  }

  public humidityChartData:any[]
  public humidityChartLabels:any[]
  public humidityChartLegend:boolean = true
  public humidityChartType:string = 'line'
  public humidityChartOptions:any = {
    responsive: true,
    chartArea: {
      backgroundColor: '#333'
    },
    scales: {
      yAxes: [
        { id: 'y-axis-3', type: 'linear', display: true, position: 'left', gridLines: { display: false } }],
      xAxes: [{ display: false, gridLines: { display: false } }]
    }
  }
  public lineChartColors:Array<any> = [
  { // blue
    backgroundColor: 'rgba(83,161,229,0.2)',
    borderColor: 'rgba(83,161,229,1)',
    pointBackgroundColor: 'rgba(83,161,229,1)',
    pointBorderColor: '#fff',
    pointHoverBackgroundColor: '#fff',
    pointHoverBorderColor: 'rgba(83,161,229,0.8)'
  }
];  


//history charts
  public historyTempChartData:any[]
  public historyTempChartLabels:any[]
  public historyTempChartLegend:boolean = true
  public historyTempChartType:string = 'line'
  public historyTempChartOptions:any = {
    responsive: true,
    chartArea: {
      backgroundColor: '#333'
    },
    scales: {
      yAxes: [
        { id: 'y-axis-1', type: 'linear', display: true, position: 'left', gridLines: { display: false } }],
      xAxes: [{ display: false, gridLines: { display: false } }]
    }
  }  

  public historyHumidityChartData:any[]
  public historyHumidityChartLabels:any[]
  public historyHumidityChartLegend:boolean = true
  public historyHumidityChartType:string = 'line'
  public historyHumidityChartOptions:any = {
    responsive: true,
    chartArea: {
      backgroundColor: '#333'
    },
    scales: {
      yAxes: [
        { id: 'y-axis-3', type: 'linear', display: true, position: 'left', gridLines: { display: false } }],
      xAxes: [{ display: false, gridLines: { display: false } }]
    }
  }

  constructor(
    private navCtrl: NavController,
    public navParams: NavParams,
    private toastCtrl: ToastController,
    private loadingCtrl: LoadingController,
    private domSanitizer: DomSanitizer, 
    private auth: AuthService,
    private sensorStore: SensorStore,
    private rawSensorDataStore: RawSensorDataStore,
    private sensorEventStore: SensorEventStore,
    private sensorReadingStore: SensorReadingStore,
    private sensorRollupStore: SensorRollupStore,
    private sensorAlertStore: SensorAlertStore,
    public userSettingStore: UserSettingStore
  ) {
    
    this.selectedStationId = navParams.get('selectedStationId');
    this.selectedSensorId = navParams.get('selectedSensorId');
    this.sensorName = navParams.get('sensorName');
    this.isShared = navParams.get('isShared');
    this.sensorState = navParams.get('selectedSensorState');
    this.sensor.sensorType = navParams.get('selectedSensorType');
    
  }

  ionViewDidLoad() {

  }

  ionViewDidLeave() {
    console.log('Left sensor details view');
    clearInterval(this.detailTimer);
  }

  ionViewDidEnter() {
    if (!this.isShared)
    {      
      this.getSensorDetails();
      this.detailTimer = setInterval(() => this.getSensorDetails(), 5 * 1000);    
      this.getUserSettings();
    }
    else
    {
      this.getSharedSensorDetails();
      this.detailTimer = setInterval(() => this.getSharedSensorDetails(), 5 * 1000);        
    }

  }

  getSensorDetails() {
    this.sensorStore.refreshSelectedSensor(this.selectedSensorId).subscribe(sensor => {
      if (!sensor) { 
        console.log('Could not get sensor details. Please check logs') 
      }
      else
      {        
        
        this.sensor = sensor;
        this.secondsSinceLastUpdate = (new Date().getTime() - new Date(this.sensor.updatedOn).getTime()) / 1000;

        //console.log(JSON.stringify(sensor.dataMap));
        if (sensor.dataMap && ((sensor.dataMap.w && sensor.dataMap.w === 'water') ||
            (sensor.dataMap.ws && sensor.dataMap.ws === 'on'))) {

              this.waterDetected = true;    
        }
        else {
          this.waterDetected = false;
        }

        if (sensor.sensorType != 'Garden' &&
            sensor.sensorType != 'Attic' &&
            sensor.sensorType != 'Barn' &&
            sensor.sensorType != 'Basement' &&
            sensor.sensorType != 'Bird Cage' &&
            sensor.sensorType != 'Bonsai' &&
            sensor.sensorType != 'Chicken Coop' &&
            sensor.sensorType != 'Dog House' &&
            sensor.sensorType != 'Greenhouse' &&
            sensor.sensorType != 'Greenhouse Indoor' &&
            sensor.sensorType != 'Hot Tub' &&
            sensor.sensorType != 'Humidity' &&
            sensor.sensorType != 'Humidor' &&            
            sensor.sensorType != 'Light' &&
            sensor.sensorType != 'Pool' &&
            sensor.sensorType != 'Reptile Tank' &&
            sensor.sensorType != 'Rodent Cage' &&
            sensor.sensorType != 'Room' &&
            sensor.sensorType != 'Sauna' &&
            sensor.sensorType != 'Shed' &&
            sensor.sensorType != 'Stairwell' &&
            sensor.sensorType != 'Temperature' &&
            sensor.sensorType != 'Terrarium' &&
            sensor.sensorType != 'Turtle Tank' &&
            sensor.sensorType != 'Wine Cellar')
        {
          this.sensorState = sensor.sensorStatus;
          this.helperText = sensor.sensorStatus;
        }
                
        this.getSensorAlertDetails();              
        
      }
      })
  }

  getSharedSensorDetails() {
    this.sensorStore.refreshSelectedSharedSensor(this.selectedStationId, this.selectedSensorId).subscribe(sensor => {
      if (!sensor) { 
        console.log('Could not get shared sensor details. Please check logs') 
      }
      else
      {                
        this.sensor = sensor;
        this.secondsSinceLastUpdate = (new Date().getTime() - new Date(this.sensor.updatedOn).getTime()) / 1000;
        
        if (sensor.sensorType != 'Garden' &&
            sensor.sensorType != 'Attic' &&
            sensor.sensorType != 'Barn' &&
            sensor.sensorType != 'Basement' &&
            sensor.sensorType != 'Bird Cage' &&
            sensor.sensorType != 'Bonsai' &&
            sensor.sensorType != 'Chicken Coop' &&
            sensor.sensorType != 'Dog House' &&
            sensor.sensorType != 'Greenhouse' &&            
            sensor.sensorType != 'Greenhouse Indoor' &&
            sensor.sensorType != 'Hot Tub' &&
            sensor.sensorType != 'Humidity' &&
            sensor.sensorType != 'Humidor' &&
            sensor.sensorType != 'Light' &&
            sensor.sensorType != 'Pool' &&
            sensor.sensorType != 'Reptile Tank' &&
            sensor.sensorType != 'Rodent Cage' &&
            sensor.sensorType != 'Room' &&
            sensor.sensorType != 'Sauna' &&
            sensor.sensorType != 'Shed' &&
            sensor.sensorType != 'Stairwell' &&
            sensor.sensorType != 'Temperature' &&
            sensor.sensorType != 'Terrarium' &&
            sensor.sensorType != 'Turtle Tank' &&
            sensor.sensorType != 'Wine Cellar')
        {
          this.sensorState = sensor.sensorStatus;
          this.helperText = sensor.sensorStatus;
        }        
        
        this.getSensorAlertDetails();
        
      }
      })
  }  

  getSensorAlertDetails() {
    this.sensorAlertStore.refreshSelectedSensorAlert(this.selectedSensorId).subscribe(sensoralert => {
      if (!sensoralert || !sensoralert.sensorId) { 
        console.log("Sensor alerts don't exist for this sensor.") 
      }
      else
      {        
        //see if its a type whos status comes from the alerts
        if (this.sensor.sensorType === 'Garden' ||
            this.sensor.sensorType === 'Attic' ||
            this.sensor.sensorType === 'Barn' ||
            this.sensor.sensorType === 'Basement' ||
            this.sensor.sensorType === 'Bird Cage' ||
            this.sensor.sensorType === 'Bonsai' ||
            this.sensor.sensorType === 'Chicken Coop' ||
            this.sensor.sensorType === 'Dog House' ||
            this.sensor.sensorType === 'Greenhouse' ||
            this.sensor.sensorType === 'Greenhouse Indoor' ||
            this.sensor.sensorType === 'Hot Tub' ||
            this.sensor.sensorType === 'Humidor' ||
            this.sensor.sensorType === 'Pool' ||
            this.sensor.sensorType === 'Reptile Tank' ||
            this.sensor.sensorType === 'Rodent Cage' ||
            this.sensor.sensorType === 'Room' ||
            this.sensor.sensorType === 'Sauna' ||
            this.sensor.sensorType === 'Shed' ||
            this.sensor.sensorType === 'Stairwell' ||
            this.sensor.sensorType === 'Temperature' ||
            this.sensor.sensorType === 'Terrarium' ||
            this.sensor.sensorType === 'Turtle Tank' ||
            this.sensor.sensorType === 'Wine Cellar')
        {
          this.sensorState = sensoralert.temperatureAlertState;
          if (sensoralert.temperatureAlertState !== 'MEDIUM')
          {
            this.helperText = sensoralert.temperatureAlertState + " TEMP";
          }
          else 
          {
            this.helperText = '';
          }          
        }        
        else if (this.sensor.sensorType === 'Humidity')
        {
          this.sensorState = sensoralert.humidityAlertState;
          if (sensoralert.humidityAlertState !== 'MEDIUM')
          {
            this.helperText = sensoralert.humidityAlertState + " HUMIDITY";
          }          
        }
        else if (this.sensor.sensorType === 'Light')
        {
          this.sensorState = sensoralert.luxAlertState;
          if (sensoralert.luxAlertState !== 'MEDIUM')
          {
            this.helperText = sensoralert.luxAlertState + " BRIGHTNESS";
          }          
        }
        
        var sIntervalSeconds = 600; //10 minutes
        if (sensoralert.sensorInterval && sensoralert.sensorInterval !== undefined) {
          //if we don't receive an update in more than 2 intervals of time, alert the user
          sIntervalSeconds = sensoralert.sensorInterval * 60 * 2;          
        }

        if (this.secondsSinceLastUpdate > sIntervalSeconds)
        {
          //console.log('setting sensor error');
          this.sensorError = 'This sensor hasn\'t sent an update in a while, check the battery or internet connection!';
        }
        else
        {
          //console.log('clearing sensor error');
          this.sensorError = null;
        }        
      }
    })
  }    

  getSensorReadingDetails() {
    this.loading = this.loadingCtrl.create({
      spinner: 'dots',
      content: 'Loading Charts ...'
    });

    this.loading.present();  

    this.sensorReadingStore.refreshSelectedSensorReadings(this.selectedSensorId).subscribe(sensorreadings => {
      if (!sensorreadings) { 
        console.log('Could not get sensor readings. Please check logs');
        this.loading.dismiss();
      }
      else
      {
        let data = sensorreadings.json();
        this.createCharts(data.sensorreadings);
      }
    })
  }  

  getSensorRollupDetails() {

    this.loading = this.loadingCtrl.create({
      spinner: 'dots',
      content: 'Loading Historic Data ...'
    });

    this.loading.present();

    this.sensorReadingStore.refreshSelectedSensorReadings(this.selectedSensorId).subscribe(sensorreadings => {
      if (!sensorreadings) { 
        console.log('Could not get sensor readings. Please check logs');  
        this.loading.dismiss();      
      }
      else
      {
        let data = sensorreadings.json();
        this.createHistoryCharts(data.sensorreadings);
        this.loading.dismiss();
      }
    });    
  
  }    

  getSensor1wRollupDetails() {

    this.loading = this.loadingCtrl.create({
      spinner: 'dots',
      content: 'Loading Historic Data ...'
    });

    this.loading.present();

    this.sensorReadingStore.refreshSelectedSensorReadings(this.selectedSensorId).subscribe(sensorreadings => {
      if (!sensorreadings) { 
        console.log('Could not get sensor readings. Please check logs'); 
        this.loading.dismiss();       
      }
      else
      {
        let data = sensorreadings.json();
        this.createHistoryCharts(data.sensorreadings);
        this.loading.dismiss();
      }
    });    
  
  }  

  getSensor1mRollupDetails() {
    if (this.userSettings.hasSubscription)
    {  
      this.loading = this.loadingCtrl.create({
        spinner: 'dots',
        content: 'Loading Historic Data ...'
      });

      this.loading.present();

      this.sensorRollupStore.selectedSensor1mRollups(this.selectedSensorId).subscribe(sensorrollups => {
        if (!sensorrollups) { 
          console.log('Could not get sensor rollups. Please check logs');
          this.loading.dismiss();
        }
        else
        {
          let data = sensorrollups.json();
          this.createHistoryCharts(data.sensorrollups);
          this.loading.dismiss();
        }
      });
    }
  }    

  getSensor3mRollupDetails() {
    if (this.userSettings.hasSubscription)
    {  
      this.loading = this.loadingCtrl.create({
        spinner: 'dots',
        content: 'Loading Historic Data ...'
      });

      this.loading.present();

      this.sensorRollupStore.selectedSensor3mRollups(this.selectedSensorId).subscribe(sensorrollups => {
        if (!sensorrollups) { 
          console.log('Could not get sensor rollups. Please check logs');
          this.loading.dismiss();
        }
        else
        {
          let data = sensorrollups.json();
          this.createHistoryCharts(data.sensorrollups);
          this.loading.dismiss();
        }
      });
    }
  }  

  getSensor6mRollupDetails() {
    if (this.userSettings.hasSubscription)
    {  
      this.loading = this.loadingCtrl.create({
        spinner: 'dots',
        content: 'Loading Historic Data ...'
      });

      this.loading.present();

      this.sensorRollupStore.selectedSensor6mRollups(this.selectedSensorId).subscribe(sensorrollups => {
        if (!sensorrollups) { 
          console.log('Could not get sensor rollups. Please check logs');
          this.loading.dismiss();
        }
        else
        {
          let data = sensorrollups.json();
          this.createHistoryCharts(data.sensorrollups);
          this.loading.dismiss();
        }
      });
    }
  }    

  getSensor1yRollupDetails() {
    if (this.userSettings.hasSubscription)
    {  
      this.loading = this.loadingCtrl.create({
        spinner: 'dots',
        content: 'Loading Historic Data ...'
      });

      this.loading.present();

      this.sensorRollupStore.selectedSensor1yRollups(this.selectedSensorId).subscribe(sensorrollups => {
        if (!sensorrollups) { 
          console.log('Could not get sensor rollups. Please check logs');
          this.loading.dismiss();
        }
        else
        {
          let data = sensorrollups.json();
          this.createHistoryCharts(data.sensorrollups);
          this.loading.dismiss();
        }
      });
    }
  }    

  getSensorEvents() {
    this.loading = this.loadingCtrl.create({
      spinner: 'dots',
      content: 'Loading Sensor Events ...'
    });

    this.loading.present();    

    this.sensorEventStore.refreshSelectedSensorEvents(this.selectedSensorId).subscribe(sensorevents => {
      if (!sensorevents) { 
        console.log('Could not get sensor events. Please check logs');
      }
      this.loading.dismiss();
    })
  }  

  doRefresh (refresher) {
    let subscription = this.sensorStore.refreshSelectedSensor(this.selectedSensorId).subscribe({
      complete: () => {
        subscription.unsubscribe()
        refresher.complete()
      }
    })
  }

  deleteSensor (index) {
    this.sensorStore.deleteSensor(index).subscribe(sensor => {
      if (!sensor) { return console.log('could not delete sensor. Please check logs') }

      this.presentToast(`"${sensor.name}" was deleted.`)
    })
  }

  openEditSensor () {
      this.navCtrl.push(EditSensorPage, {
      selectedSensorId: this.selectedSensorId,
      sensorName: this.sensorName
    });
  }

  openCommunity () {
      this.navCtrl.push(CommunityPage, {
    });
  }

  openSubscriptions () {
      this.navCtrl.setRoot(SubscriptionsPage, {
    });
  }    

  openEditSensorAlerts () {
      this.navCtrl.push(EditSensorAlertsPage, {
      selectedSensorId: this.selectedSensorId,
      sensorName: this.sensorName,
      sensorType: this.sensor.sensorType
    });
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

  footerSegmentChanged(event)
  {    
    console.log('footer changed, sensorType: ' + this.sensor.sensorType + ' sensorState: ' + this.sensorState);
    var tmptype = this.sensor.sensorType;
    var tmpstate = this.sensorState;
    this.sensor.sensorType = tmptype;
    this.sensorState = tmpstate;

    if (this.infoView == 'history')    
    {
      console.log('load historic data based on the timeLength: ' + this.timeLength);
      if (this.timeLength == '1d')
      {
        this.getSensorRollupDetails();
      }
      else if (this.timeLength == '1w')
      {
        this.getSensor1wRollupDetails();
      }
      else if (this.timeLength == '1m')
      {
        this.getSensor1mRollupDetails();
      }
      else if (this.timeLength == '3m')
      {
        this.getSensor3mRollupDetails();
      }
      else if (this.timeLength == '6m')
      {
        this.getSensor6mRollupDetails();
      }
      else if (this.timeLength == '1y')
      {
        this.getSensor1yRollupDetails();
      }
    }
    else if (this.infoView == 'notifications')
    {
      this.getSensorEvents();
    }
    else if (this.infoView == 'charts')
    {
      this.getSensorReadingDetails();
    }
  }

  createHistoryCharts(sensorrollups)
  {
    console.log('Creating history chart array size: ' + sensorrollups.length);

    this.historyTempChartLabels = [];
    var historyTemps = [];
    var historyHumidity = [];
    this.historyHumidityChartLabels = [];

    var d = Date.now();
    var yesterdayNow = (d - 86400000) / 1000;
    var weekAgoNow = (d - (86400000 * 7)) / 1000;

    for (var i=sensorrollups.length - 1; i>0; i--) {

      if (this.timeLength == '1d')
      {
        if (sensorrollups[i].readingDateTime > yesterdayNow)
        {
          this.historyTempChartLabels.push(moment.unix(Number(sensorrollups[i].readingDateTime)).format(this.rawDisplayFormat));
          this.historyHumidityChartLabels.push(moment.unix(Number(sensorrollups[i].readingDateTime)).format(this.rawDisplayFormat));
          historyTemps.push(sensorrollups[i].temp);
          historyHumidity.push(sensorrollups[i].humidity);          
        }
      }
      else if (this.timeLength == '1w')
      {        
        if (sensorrollups[i].readingDateTime > weekAgoNow)
        {
          this.historyTempChartLabels.push(moment.unix(Number(sensorrollups[i].readingDateTime)).format(this.rawDisplayFormat));
          this.historyHumidityChartLabels.push(moment.unix(Number(sensorrollups[i].readingDateTime)).format(this.rawDisplayFormat));
          historyTemps.push(sensorrollups[i].temp);
          historyHumidity.push(sensorrollups[i].humidity);
        }
      }
      else if (this.timeLength == '1m')
      {
        this.historyTempChartLabels.push(moment(new Date(sensorrollups[i].sensorFifteenMinuteRollupId)).format(this.rawDisplayFormat));
        this.historyHumidityChartLabels.push(moment(new Date(sensorrollups[i].sensorFifteenMinuteRollupId)).format(this.rawDisplayFormat));     

        historyTemps.push(sensorrollups[i].avgTemp);
        historyHumidity.push(sensorrollups[i].avgHumidity);      
      }
      else if (this.timeLength == '3m' || this.timeLength == '6m')
      {
        this.historyTempChartLabels.push(moment(new Date(sensorrollups[i].sensorOneHourRollupId)).format(this.rawDisplayFormat));
        this.historyHumidityChartLabels.push(moment(new Date(sensorrollups[i].sensorOneHourRollupId)).format(this.rawDisplayFormat));

        historyTemps.push(sensorrollups[i].avgTemp);
        historyHumidity.push(sensorrollups[i].avgHumidity);        
      }
      else if (this.timeLength == '1y')
      {
        this.historyTempChartLabels.push(moment(new Date(sensorrollups[i].sensorThreeHourRollupId)).format(this.rawDisplayFormat));
        this.historyHumidityChartLabels.push(moment(new Date(sensorrollups[i].sensorThreeHourRollupId)).format(this.rawDisplayFormat));           

        historyTemps.push(sensorrollups[i].avgTemp);
        historyHumidity.push(sensorrollups[i].avgHumidity);     
      }
    }    

    //Chart.js code
    this.historyTempChartData = 
      [{
          label: "Temperature",
          yAxisID: 'y-axis-1',
          radius: 0,
          data : historyTemps         
      }
      ]
    
    this.historyHumidityChartData = 
      [{
          label: "Humidity",
          yAxisID: 'y-axis-3',
          radius: 0,
          data : historyHumidity      
      }]    
  }

  createCharts(sensorreadings) { 
    console.log('Creating temperature chart array size: ' + sensorreadings.length);

    this.temperatureChartLabels = [];
    var recentTemps = [];
    var recentHumidity = [];
    this.humidityChartLabels = [];

    for (var i=sensorreadings.length - 1; i>0; i--) {

      this.temperatureChartLabels.push(moment.unix(Number(sensorreadings[i].readingDateTime)).format(this.rawDisplayFormat));
      this.humidityChartLabels.push(moment.unix(Number(sensorreadings[i].readingDateTime)).format(this.rawDisplayFormat));
      recentTemps.push(sensorreadings[i].temp);
      recentHumidity.push(sensorreadings[i].humidity);
    }    

    //Chart.js code
    this.temperatureChartData = 
      [{
          label: "Temperature",
          yAxisID: 'y-axis-1',
          radius: 0,
          data : recentTemps         
      }
      ]
    
    this.humidityChartData = 
      [{
          label: "Humidity",
          yAxisID: 'y-axis-3',
          radius: 0,
          data : recentHumidity     
      }]          

    this.loading.dismiss();
  }

  lowerCase(s)
  {
    if (s)
    {
      s = s.replace(" ", "_");
      return s.toLowerCase();
    }
    else
    {
      return s;
    }
  }

  getUpdateDate(d)
  {
    var todaysDate = new Date();
    var updateDate = new Date(d);
    if (todaysDate.setHours(0,0,0,0) == updateDate.setHours(0,0,0,0))
    {
      return moment(d).format('LTS');
    }
    else
    {
      return new Date(d).toLocaleString();
    }
    
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

  openSensorDetailsVideo() {
    this.showSensorDetailsVideo = true;

    this.trustedSensorDetailsVideoUrl = this.domSanitizer.bypassSecurityTrustResourceUrl(this.sensorDetailsVideo.url);

    this.loading = this.loadingCtrl.create({
      content: 'Loading Video ...'
    });

    this.loading.present();  
  }      
  
  handleIFrameLoadEvent(): void {
    this.loading.dismiss();
  }  

  setTempHelper()
  {
    this.helperText = 'Current Temperature: ' + this.sensor.lastTemperature + '°';
  }
  setHumidityHelper()
  {
    this.helperText = 'Current Humidity: ' + this.sensor.lastHumidity + '%';
  }
  setLuxHelper()
  {
    this.helperText = 'Current Luxometer(Light): ' + this.sensor.lastLux;
  }  
  setUpdateHelper()
  {
    this.helperText = 'Last Update (Seconds): ' + this.secondsSinceLastUpdate;
  }
}
