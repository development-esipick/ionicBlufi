import { Component } from '@angular/core'
import { NavController, NavParams, ViewController } from 'ionic-angular'
import { AuthService } from '../../app/auth.service'
import { CognitoUser , CognitoUserAttribute } from 'amazon-cognito-identity-js'
import { HomePage } from '../home/home';
import { StationsPage } from '../stations/stations';

@Component({
  selector: 'page-ifttt',
  templateUrl: 'ifttt.html'
})
export class IFTTTPage {

  constructor(public navCtrl: NavController, public navParams: NavParams, public viewCtrl: ViewController, public auth: AuthService) {}

  ionViewDidLoad() {

  }

  goIFTTT() {
	window.open("https://ifttt.com/simplesensor",'_system', 'location=yes');
  }

  goBack() {
    this.navCtrl.pop();
  }
}
