import { Component } from '@angular/core';
import { ViewController, Platform } from 'ionic-angular';
import { SplashScreen } from '@ionic-native/splash-screen';
 
@Component({
  selector: 'page-splash',
  templateUrl: 'splash.html',
})
export class Splash {

  platform;
 
  constructor(public viewCtrl: ViewController, public splashScreen: SplashScreen, platform: Platform) {
    this.platform = platform;
  }
 
  ionViewDidEnter() {
 
    this.splashScreen.hide();
 
    if (this.platform.is('iphone') || this.platform.is('android'))
    {
      setTimeout(() => {
        this.viewCtrl.dismiss();
      }, 6000);    
    }
    else
    {
      setTimeout(() => {
        this.viewCtrl.dismiss();
      }, 6000);        
    }
  }
 
}