import { Component, NgZone } from '@angular/core'
import { NavController, NavParams, ViewController, LoadingController, Platform } from 'ionic-angular'
import { AuthService } from '../../app/auth.service'
import { IUserSetting } from '../../app/usersetting.interface'
import { UserSettingStore } from '../../app/usersetting.store'
import { StationsPage } from '../../pages/stations/stations'
import { StationStore } from '../../app/station.store'
import { InAppPurchase2, IAPProduct } from '@ionic-native/in-app-purchase-2';

@Component({
  selector: 'page-subscriptions',
  templateUrl: 'subscriptions.html'
})
export class SubscriptionsPage {

  public product: any = {
    name: 'Monthly Subscription',
    appleProductId: 'monthly_10_sensors',
    googleProductId: 'monthly_10_sensors'
  };

  public product25: any = {
    name: 'Monthly Subscription',
    appleProductId: 'monthly_25_sensors',
    googleProductId: 'monthly_25_sensors'
  };

  public product50: any = {
    name: 'Monthly Subscription',
    appleProductId: 'monthly_50_sensors',
    googleProductId: 'monthly_50_sensors'
  };

  public product100: any = {
    name: 'Monthly Subscription',
    appleProductId: 'monthly_100_sensors',
    googleProductId: 'monthly_100_sensors'
  };  

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

  numSensors = 0;
  recommendedSubscription: any = null;
  currentSubscription: any = null;

  subscriptionIcon = 'lock';
  subscriptionIconColor = 'white';

  isPurchased = false;
  storeReady = false;

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    public viewCtrl: ViewController,
    public auth: AuthService,
    public loadingCtrl: LoadingController,
    public userSettingStore: UserSettingStore,
    private stationStore: StationStore,
    private store: InAppPurchase2,
    public platform: Platform,
    private ngZone: NgZone) 
  {
    
  }

  ionViewDidLoad() {      
    this.getUserSettings();
  }

  async configurePurchasing() {
    if (!this.platform.is('cordova')) { return; }

    this.loading = this.loadingCtrl.create({
      spinner: 'dots',
      content: 'Loading Subscription Information ...'
    });

    this.loading.present(); 

    let productId;
    let product25Id;
    let product50Id;
    let product100Id;

    try {
      if (this.platform.is('ios')) {
        productId = this.product.appleProductId;
        product25Id = this.product25.appleProductId;
        product50Id = this.product50.appleProductId;
        product100Id = this.product100.appleProductId;
      } else if (this.platform.is('android')) {
        productId = this.product.googleProductId;
        product25Id = this.product25.googleProductId;
        product50Id = this.product50.googleProductId;
        product100Id = this.product100.googleProductId;
      }

      // Register Product
      // Set Debug High
      //this.store.verbosity = this.store.DEBUG;
      // Register the product with the store
      this.store.register({
        id: productId,
        alias: productId,
        type: this.store.PAID_SUBSCRIPTION
      });

      this.store.register({
        id: product25Id,
        alias: product25Id,
        type: this.store.PAID_SUBSCRIPTION
      });

      this.store.register({
        id: product50Id,
        alias: product50Id,
        type: this.store.PAID_SUBSCRIPTION
      });

      this.store.register({
        id: product100Id,
        alias: product100Id,
        type: this.store.PAID_SUBSCRIPTION
      });      

      this.registerHandlers(productId);
      this.registerHandlers(product25Id);
      this.registerHandlers(product50Id);
      this.registerHandlers(product100Id);

      let self = this;
      this.store.ready(function() {
        self.loading.dismiss();
        console.log('Store is Ready or Something');   
        console.log('after store is ready');
        self.storeReady = true;    
        self.recommendProduct();      
      });

      // Errors On The Specific Product
      this.store.when(productId).error( (error) => {
        alert('An Error Occured' + JSON.stringify(error));
      });

      this.store.when(product25Id).error( (error) => {
        alert('An Error Occured' + JSON.stringify(error));
      });

      // Refresh Always
      console.log('Refresh Store');
      this.store.refresh();
    } catch (err) {
      console.log('Error On Store Issues' + JSON.stringify(err));
    }
  }

  registerHandlers(productId) {
    // Handlers
    this.store.when(productId).approved( (product: IAPProduct) => {
      // Purchase was approved
      console.log('Purchase Approved: ' + JSON.stringify(product));
      this.subscriptionIcon = 'checkmark-circle';
      this.subscriptionIconColor = 'secondary';    

      //this.loading.dismiss();
      this.isPurchased = true;  
      this.editSettings(product);
      product.finish();      
    });

    this.store.when(productId).registered( (product: IAPProduct) => {
      console.log('Registered: ' + JSON.stringify(product));
    });

    this.store.when(productId).updated( (product: IAPProduct) => {
      console.log('Product Updated' + JSON.stringify(product));     

      //try to catch ios hole      
      if (!this.isPurchased && product.owned && !this.userSettings.hasSubscription && product.transaction != null)
      {
        console.log("Product is owned but user doesn't have subscription in simplesensor.");
        this.isPurchased = true;
        this.editSettings(product);
      }      
      else
      {
        console.log("Cannot evaluate if a hasSubscription should be true: " + this.isPurchased + ":" + product.owned + ":" + this.userSettings.hasSubscription + ":" + product.transaction);
      }       
    });

    this.store.when(productId).cancelled( (product) => {
      alert('Purchase was Cancelled');
      this.loading.dismiss();
    });

    // Overall Store Error
    this.store.error( (err) => {
      alert('Store Error ' + JSON.stringify(err));
    });
  }

  get size() { return this.store.products.length; }  

  getUserSettings() {

    this.loading = this.loadingCtrl.create({
      spinner: 'dots',
      content: 'Loading User Settings ...'
    });

    this.loading.present();

    this.userSettingStore.refresh().subscribe(usersettings => {

      if (!usersettings || !usersettings.userId) { 
        console.log("Settings don't exist for this user.");
      }
      else
      {
        console.log('loading settings');
        this.userSettings = usersettings;
        
      }
      this.stationStore.getAllStations().subscribe(stations => {
        if (!stations) { 
          console.log('Could not get stations. Please check logs') 
        }
        else
        {        
          //console.log(stations);
          for (var x = 0; x < stations.length; x++)
          {
            //console.log(stations[x].numSensors);
            this.numSensors = this.numSensors + stations[x].numSensors;            
          }
          this.configurePurchasing();          
        }      
      });      

      this.loading.dismiss();
    });
  }    

  purchaseRecommendation(pId)
  {
    console.log('Ordering From Store: ' + pId);
    try {
      let product = this.store.get(pId);
      console.log('Product Info: ' + JSON.stringify(product));      
      this.store.order(pId).then( () => {
        console.log('Purchase Started');
        //this.loading = this.loadingCtrl.create({
        //  spinner: 'dots',
        //  content: 'Purchasing Subscription ...'
        //});

        //this.loading.present();

      }).catch( (error) => {
        console.log('Error Ordering From Store: ' + error);
        //this.loading.dismiss();        

      });            
    } catch (err) {
      console.log('Error Ordering ' + JSON.stringify(err));
    }
  }

  async recommendProduct() {
    console.log('recommending a product: ' + this.numSensors);
    if (this.numSensors > 0 && this.numSensors <=10)
    {
      console.log('recommend: product');
      let productId;

      if (this.platform.is('ios')) {
        productId = this.product.appleProductId;
      } else if (this.platform.is('android')) {
        productId = this.product.googleProductId;
      }

      let product = this.store.get(productId);      
      if (!product.owned)
      {        
        this.ngZone.run(() => {
          console.log('setting recommendedSubscription');
          this.recommendedSubscription = product;
        }).catch(error => {
          console.log('error running ngZone');
        });        
        
      }
      else 
      {        
        this.ngZone.run(() => {
          console.log('setting currentSubscription');
          this.currentSubscription = product;
        }).catch(error => {
          console.log('error running ngZone');
        });              
      }
    }
    else if (this.numSensors <= 25)
    {
      console.log('recommend: product25');
      let productId;

      if (this.platform.is('ios')) {
        productId = this.product25.appleProductId;
      } else if (this.platform.is('android')) {
        productId = this.product25.googleProductId;
      }

      let product = this.store.get(productId);      
      if (!product.owned)
      {
        this.ngZone.run(() => {
          console.log('setting recommendedSubscripton');
          this.recommendedSubscription = product;
        }).catch(error => {
          console.log('error running ngZone');
        });           
      }
      else 
      {
        this.ngZone.run(() => {
          console.log('setting currentSubscripton');
          this.currentSubscription = product;
        }).catch(error => {
          console.log('error running ngZone');
        });           
      }
    }
    else if (this.numSensors <= 50)
    {
      console.log('recommend: product50');
      let productId;

      if (this.platform.is('ios')) {
        productId = this.product50.appleProductId;
      } else if (this.platform.is('android')) {
        productId = this.product50.googleProductId;
      }

      let product = this.store.get(productId);      
      if (!product.owned)
      {
        this.ngZone.run(() => {
          this.recommendedSubscription = product;
        }).catch(error => {
          console.log('error running ngZone');
        });           
      }
      else 
      {
        this.ngZone.run(() => {
          this.currentSubscription = product;
        }).catch(error => {
          console.log('error running ngZone');
        });           
      }      
    }
    else if (this.numSensors <= 100)
    {
      console.log('recommend: product100');
      let productId;

      if (this.platform.is('ios')) {
        productId = this.product100.appleProductId;
      } else if (this.platform.is('android')) {
        productId = this.product100.googleProductId;
      }

      let product = this.store.get(productId);      
      if (!product.owned)
      {
        this.ngZone.run(() => {
          this.recommendedSubscription = product;
        }).catch(error => {
          console.log('error running ngZone');
        });           
      }
      else 
      {
        this.ngZone.run(() => {
          this.currentSubscription = product;
        }).catch(error => {
          console.log('error running ngZone');
        });           
      }      
    }

  }

  editSettings (product) {        

    if (this.isPurchased && this.storeReady)
    {
      console.log('Editing settings...');

      this.loading = this.loadingCtrl.create({
        spinner: 'dots',
        content: 'Saving Settings ...'
      });

      this.loading.present();  

      this.userSettings.userId = this.auth.currentIdentity;
      this.userSettings.hasSubscription = true;
      this.userSettings.currentSubscriptionId = product.id;
      if (!this.userSettings.subscriptionReceipts)
      {
        this.userSettings.subscriptionReceipts = [];
      }
      this.userSettings.subscriptionReceipts.push(product.transaction);

      console.log('would be saving: ' + JSON.stringify(this.userSettings));
      this.userSettingStore.editUserSetting(this.userSettings).subscribe(usersettings => {
        if (usersettings) {
          console.log('Edited usersetting.');
          this.loading.dismiss();          
        } else {
          console.log('Could not edit user setting. Please see logs')
        }
      });
    }
  }
}
