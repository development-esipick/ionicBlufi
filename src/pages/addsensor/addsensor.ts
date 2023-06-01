import { Component, NgZone } from '@angular/core'
import { AlertController, NavController, NavParams, ViewController, Loading, LoadingController, Platform } from 'ionic-angular'
import { SafeResourceUrl, DomSanitizer } from '@angular/platform-browser';
import { AuthService } from '../../app/auth.service'
import { ISensor } from '../../app/sensor.interface'
import { SensorStore } from '../../app/sensor.store'
import { StationDetailsPage } from '../stationdetails/stationdetails'
import { EditSensorPage } from '../editsensor/editsensor'
import { Storage } from '@ionic/storage';
import * as moment from 'moment'
import CryptoJS from 'crypto-js';

declare var window;
declare var nfc: any;

// WIFIWizard to get current connection
declare var WifiWizard2: any;

@Component({
  selector: 'page-addsensor',
  templateUrl: 'addsensor.html'
})
export class AddSensorPage {

  selectedStationId = '';

  nfcIcon = 'qr-scanner';
  nfcIconColor = 'white';
  nfcName = '';
  nfcTimer: any = null;
  nfcTriggered = false;

  blufi: any; 
  blufiDevice: any;
  blufiDeviceName: any = null;

  //WiFi Placeholders
  networkName: any = null;
  networkPassword: any = null;    

  showNFC = true;
  showForm = false;
  showVideo = false;

  displayFormat:string = 'YYYY-MM-DD'
  sensor:ISensor = {
    sensorId: null,
    name: null,
    sensorType: null,
    sensorStatus: null,
    batteryLevel: -1,
    lastTemperature: -1,
    lastHumidity: -1,
    lastLux: -1,
    lastMagnetox: -1,
    lastMagnetoy: -1,
    lastMagnetoz: -1,
    userId: null,
    stationId: null,
    updatedOn: moment().format(),
    createdOn: moment().format(),
    registeredOn: moment().format()
  }

  eUser = '';
  sKey = '';
  mKey = '';

  customConfig: any = {mqtt: {
    host: 'mqtt://SimpleSensorLB-0eb3e09a7fe0be0e.elb.us-east-1.amazonaws.com',
    port: 1883,
    user: '',
    pass: '',
    sensorId: '',
    sharedKey: '',
    mKey: '',
    dateTime: ''
  }};

  video: any = {
        url: 'https://www.youtube.com/embed/DmxU6wkEL50?list=PLh12Jh0K061eDe4tmjozU22QKvmq6d-ac',
        title: 'SimpleSensor Setup'
  };  

  trustedVideoUrl: SafeResourceUrl;
  loading: Loading;

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    public viewCtrl: ViewController,
    public auth: AuthService,
    public loadingCtrl: LoadingController,
    private sensorStore: SensorStore,    
    private domSanitizer: DomSanitizer,
    public platform: Platform,
    private storage: Storage,
    public alertController: AlertController,
    private ngZone: NgZone) 
  {

    this.selectedStationId = navParams.get('selectedStationId');
    this.blufi = window.cordova ? window.cordova.plugins.blufi : false;

    nfc.addNdefListener((event) => {
      console.log('successfully read from ndef listener', event);
      //only for android
      this.handleNFCEvent(event);

    }, (success) => {
      console.log('Attached ndef listener', success);

      if (platform.is('ios')) {
        nfc.scanTag().then(
          tag => {
            console.log('Scanned NFC tag: ' + JSON.stringify(tag));
            var simpleSensorIdHex = nfc.bytesToHexString(tag.ndefMessage[0].payload);
            console.log(simpleSensorIdHex);
            let hexToAsciiPromise = this.hexToAsciis(simpleSensorIdHex);
            hexToAsciiPromise.then(
              str => {
                console.log('decoded message: ' + str);

                this.nfcName = str.toString();
                this.nfcIcon = 'checkmark-circle';
                this.nfcIconColor = 'secondary';
                
                if (this.networkName != null && this.networkName != ''
                    && this.networkPassword != null && this.networkPassword != ''
                    && this.blufiDeviceName != null && this.blufiDeviceName != '')
                {
                  console.log('Everything appears to be ready for setup.');
                  this.addSensor();
                }
                else
                {
                  console.log('Need more information for SimpleSensor setup.');
                  this.getMoreInformation();
                }  
              },
              err => {}
            );                        
          },
          err => alert('Failed to start NFC session ' + err)
        );      
      }

    }, (err) => {
      console.log('Error from ndef listener', err);
      //console.log('received ndef message. the tag contains: ', event.tag);
      //console.log('decoded tag id', nfc.bytesToHexString(event.tag.id));
    });    

    //a timeout for when the user doesn't have the NFC or
    //when something else goes wrong
    this.nfcTimer = setTimeout(() => {
      if (this.showNFC && !this.showForm)
      { 
        console.log('NFC SETUP TIMEOUT: Getting more information via form.');
        this.getMoreInformation();        
      }      
    }, 45500);     
  }

  ionViewDidLoad() {}

  ionViewWillEnter(): void { 
    this.listWifiNetwork(); 
  }
  ionViewWillLeave() {
    if (this.nfcTimer != null)
    {
      clearTimeout(this.nfcTimer);
    }
  }

  async handleNFCEvent(event) {

      //console.log('received ndef event message. the tag contains: ', event.tag);
      //console.log('decoded tag id', nfc.bytesToHexString(event.tag.id));      
      //only for android

      if (!this.nfcTriggered)
      {
        this.nfcTriggered = true;

        var nfcSimpleSensorHex = nfc.bytesToHexString(event.tag.ndefMessage[0].payload);

        console.log('hex message', nfcSimpleSensorHex);
        let hexToAsciiPromise = this.hexToAsciis(nfcSimpleSensorHex);
        hexToAsciiPromise.then(
          str => {
            console.log('decoded message: ' + str);

            this.nfcName = str.toString();
            this.nfcIcon = 'checkmark-circle';
            this.nfcIconColor = 'secondary';
            
            if (this.networkName != null && this.networkName != ''
                && this.networkPassword != null && this.networkPassword != ''
                && this.blufiDeviceName != null && this.blufiDeviceName != '')
            {
              console.log('Everything appears to be ready for setup.');
              this.addSensor();
            }
            else
            {
              console.log('Need more information for SimpleSensor setup.');
              this.getMoreInformation();
            }  

          },
          error => {

          }
        );
      }
  }

  async getMoreInformation() {
    if (this.platform.is('ios'))
    {
      await this.delay(5000);
    }    
    console.log('Changing view.');

    this.ngZone.run(() => {
      this.showNFC = false;
      this.showForm = true;    
    });
  }

  async hexToAsciis(str1) {
    return new Promise(function(resolve, reject) {
      var hex  = str1.toString();      
      var str = '';
      for (var n = 0; n < hex.length; n += 2) {
        var hexSub = hex.substr(n,2);        
        var pInt = parseInt(hexSub, 16);
        if (pInt != 0)
        {
          var charFromCode = String.fromCharCode(pInt);
          //str += String.fromCharCode(parseInt(hex.substr(n, 2), 16));
          str += charFromCode;
        }
      }
      resolve(str);
    });
  }

  loadHowToVideo() {
    this.showVideo = true;

    this.trustedVideoUrl = this.domSanitizer.bypassSecurityTrustResourceUrl(this.video.url);

    this.loading = this.loadingCtrl.create({
      content: 'Loading How-To Video ...'
    });

    this.loading.present();  
  }

  listWifiNetwork() {           
    let self = this; 

    WifiWizard2.getConnectedSSID().then( 
      function( ssid ){
        //console.log( 'SSID: ' + ssid );
        self.setNetwork(ssid);        

        if (self.platform.is('android')) 
        {
          WifiWizard2.scan().then(
            function( networks ) {
              //console.log(JSON.stringify(networks));
              var validFrequency = false;
              for (var x = 0; x< networks.length; x++)
              {
                if (networks[x].SSID && networks[x].SSID == self.networkName)
                {
                  //console.log(networks[x].SSID + ' frequency: ' + networks[x].frequency);
                  if (networks[x].frequency > 2400 && networks[x].frequency < 2700)
                  {
                    //the network has a valid frequency
                    validFrequency = true;
                  }
                }
              }
              if (!validFrequency)
              {
                console.log('NO VALID FREQUENCY FOUND - SETUP WILL FAIL!!!');
                alert(`Please enable 2.4 or 2.5 GHz wifi on your router so SimpleSensor can connect to the internet.`);
                this.goToStationDetails();
              }
            },
            function( error ) {
              console.log('Error in Android getting the networks.');
            });
        }

      },
      function ( error ) {
        console.log('Error getting SSID: ' + error);
        self.errorHandler(error);
      });      
  }

  setNetwork(foundNetwork)
  {
    let self = this;
    console.log('Found network: ' + foundNetwork);
    this.networkName = foundNetwork;

    this.storage.get(foundNetwork).then((val) => {
      //console.log('Network password is', val);
      var unencryptedBytes = CryptoJS.AES.decrypt(val, 'RMSSSimpleSensor');
      var unencryptedPassword = unencryptedBytes.toString(CryptoJS.enc.Utf8);
      self.networkPassword = unencryptedPassword;
    });    

    this.startBlufiScan();
  }

  errorHandler(err: any) {
    console.log(err);
    if (this.platform.is('ios')) {
      alert(`Please ensure Wifi is enabled and connected on your phone so Wifi information can be sent to the SimpleSensor.`);
      this.goToStationDetails();
    }
    else {
      alert(`Please ensure Wifi is enabled and connected on your phone so Wifi information can be sent to the SimpleSensor.`);
      this.goToStationDetails();
    }
  }  

  startBlufiScan() {
    console.log('staring blufi scan');
    this.blufi.search("SimpleSensor", 3000, 
    success => {
      console.log('successful blufi search: ');
      console.log(success);
      if (success.length > 0)
      {
        this.blufiDevice = success[0];
        this.blufiDeviceName = this.blufiDevice.name;        
      }
    }, 
    error => {
      console.log('error searching blufi devices. ' + error);
      this.blufiErrorHandler(error);
    }
  );
  }

  blufiErrorHandler(err: any) {
    console.log(err);
    alert(`Please ensure Bluetooth is enabled on your phone so your SimpleSensor can be setup.`);
    this.goToStationDetails();
  }  

  async delay(ms: number) {
      return new Promise( resolve => setTimeout(resolve, ms) );
  }  

  async connectBlufi() {

    this.loading = this.loadingCtrl.create({
      content: 'Connecting to SimpleSensor...'
    });

    this.loading.present(); 

    await this.delay(2000);
    this.blufi.connect(
    {
      identifier: this.blufiDevice.address // name or address as retrieved from search call
    },
      response => {
        console.log('connected to blufi: ' + this.blufiDevice.address);
        //console.log(response);
        this.loading.dismiss();
        this.sendCustomConfig();
      },
      error => {
        console.log('error connecting to: ' + this.blufiDevice.address);
        console.log(error);
        this.loading.dismiss();
        this.deleteSimpleSensor('We are unable to connect to your SimpleSensor. Please try again.');                             
      }
    );  
  }

  async sendWifiInfo(device) {

    this.loading = this.loadingCtrl.create({
      content: 'Setting up SimpleSensor Wifi...'
    });

    this.loading.present(); 

    await this.delay(4000);
    console.log('sending wifi info to: ' + device.address);
    //console.log('wifi ssid: ' + this.networkName);
    //console.log('wifi pass: ' + this.networkPassword);
    var encryptedPassword = CryptoJS.AES.encrypt(this.networkPassword, 'RMSSSimpleSensor').toString();
    this.storage.set(this.networkName, encryptedPassword);
    
    this.blufi.configure(
      {
        mode: "station",
        ssid: this.networkName,
        password: this.networkPassword
      },
      response => {
        console.log('configured wifi');                
        this.loading.dismiss();     
        this.validateSensorDataReceived();      
      },
      error => {
        console.log('did not configure wifi');        
        this.loading.dismiss();
        this.deleteSimpleSensor('We were unable to configure Wifi for your SimpleSensor. Common causes are a mistyped Wifi password, Wifi network is not 2.4GHz, or perhaps the SimpleSensor is too far from the Wifi router. Please try again.');
      }
    );

  }

  async validateSensorDataReceived() {
    this.loading = this.loadingCtrl.create({
      content: 'Validating SimpleSensor ...'
    });

    this.loading.present(); 

    await this.delay(10000);
    this.sensorStore.refreshSelectedSensor(this.sensor.sensorId).subscribe(sensor => {
      if (sensor && sensor.batteryLevel > -1)
      {
        this.loading.dismiss();     
        this.navCtrl.push(EditSensorPage, {
          selectedSensorId: this.sensor.sensorId,
          sensorName: this.sensor.name,
          isNew: true
        });        
      }
      else {
        console.log('Could not validate sensor data! Deleting sensor.');
        this.loading.dismiss();
        //delete the sensor from the cloud
        this.deleteSimpleSensor('We are unable to validate your SimpleSensor. Common causes are a mistyped Wifi password, or perhaps the SimpleSensor is too far from the Wifi router. Please try again.');                     
      }
    });
  }

  async deleteSimpleSensor(errorMessage)
  {
    let self = this;

    this.sensorStore.deleteSensor(this.sensor.sensorId).subscribe(sensor => {                  
      //reset the saved wifi password in storage
      self.storage.remove(this.networkName);          

      //show error message
      const alert = self.alertController.create({
        message: errorMessage,
        buttons: [
          {
            text: 'OK',
            handler: () => {
              console.log('Confirm Okay');
              self.goToStationDetails();
            }
          }
        ]
      });

      alert.present();                     
    }); 
  }

  async sendCustomConfig() {
    
    this.loading = this.loadingCtrl.create({
      content: 'Provisioning SimpleSensor...'
    });

    this.loading.present();     
    await this.delay(5000);

    this.customConfig.mqtt.user = this.eUser;
    this.customConfig.mqtt.sensorId = this.sensor.sensorId;

    this.customConfig.mqtt.sharedKey = this.sKey;

    this.customConfig.mqtt.mKey = this.mKey;
    this.customConfig.mqtt.dateTime = new Date().getTime();

    console.log('sending custom config: ' + JSON.stringify(this.customConfig));
    this.blufi.send(JSON.stringify(this.customConfig),
      result => {
        console.log('custom data sent');
        this.loading.dismiss();
        this.sendWifiInfo(this.blufiDevice);        
      },
      error => {
        console.log(error);
        this.loading.dismiss();
      }
    );  
  }

  handleIFrameLoadEvent(): void {
    this.loading.dismiss();
  }  

  async addSensor () {
  
    if (this.nfcTimer != null)
    {
      clearTimeout(this.nfcTimer);
    }

    if (this.blufiDeviceName && this.blufiDeviceName != '')
    {
      this.sensor.sensorId = this.blufiDeviceName;
      this.sensor.name = this.blufiDeviceName;

      this.sensor.sensorType = 'Generic';
      this.sensor.sensorStatus = 'Off';

      this.sensor.userId = this.auth.currentIdentity;

      var newDate = moment(new Date()).format();
      this.sensor.createdOn = newDate;
      this.sensor.registeredOn = newDate;
      this.sensor.updatedOn = newDate;

      this.sensor.stationId = this.selectedStationId;

      this.sensorStore.addSensor(this.sensor).subscribe(sensor => {
        if (sensor) {
          console.log('Added sensor.')
          this.sensor = sensor;
          console.log(JSON.stringify(this.sensor));

          var returnObj = JSON.parse(JSON.stringify(this.sensor));
          this.eUser = returnObj.eUser;
          this.sKey = returnObj.sKey;
          this.mKey = returnObj.mKey;          

          this.connectBlufi();

        } else {
          console.log('Could not add sensor. Please see logs')
        }
      });
    }
    else
    {
      //didn't find the blufi device            
      const alert = await this.alertController.create({
        message: 'Unable to find SimpleSensor. Please reset your SimpleSensor and try again.',
        buttons: [
          {
            text: 'OK',
            handler: () => {
              console.log('Confirm Okay');
              this.goToStationDetails();
            }
          }
        ]
      });

      await alert.present();      
    }
  }

  goToStationDetails() {
    this.navCtrl.pop();
  }  
}
