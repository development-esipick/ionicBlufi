import { Component } from '@angular/core'

import { NavController, ModalController, Loading, LoadingController, Platform } from 'ionic-angular'
import { SafeResourceUrl, DomSanitizer } from '@angular/platform-browser';

import { LoginPage } from '../../pages/login/login'
import { FacebookLoginPage } from '../../pages/facebooklogin/facebooklogin'
import { AuthService } from '../../app/auth.service'


@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {

  showHelpVideo = false;

  helpVideo: any = {
        url: 'https://www.youtube.com/embed/MP8BWP1jreM',
        title: 'SimpleSensor Intro'
  };   

  trustedHelpVideoUrl: SafeResourceUrl;

  loading;

  constructor(
    public navCtrl: NavController,
    public modalCtrl: ModalController,
    public auth: AuthService,
    private loadingCtrl: LoadingController,
    private domSanitizer: DomSanitizer,
    public platform: Platform 
    ) { }

  ionViewDidLoad() { }


  openSignInPage() {
    this.navCtrl.setRoot(LoginPage, {
      page: 'login'
    });
  }

  openFacebookSignInPage() {
    this.navCtrl.setRoot(FacebookLoginPage, {
      page: 'login'
    });    
  }

  showRegistration() {
    this.navCtrl.setRoot(LoginPage, {
      page: 'register'
    });
  }

  buySimpleSensor() {
    window.open('https://simplesensor.io', '_system');
  }

  get userColor ():string {
    return this.auth.isUserSignedIn() ? 'secondary' : 'primary'
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
