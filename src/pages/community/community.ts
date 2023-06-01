import { Component } from '@angular/core'
import { NavController, NavParams, ViewController } from 'ionic-angular'
import { AuthService } from '../../app/auth.service'
import { CognitoUser , CognitoUserAttribute } from 'amazon-cognito-identity-js'
import { HomePage } from '../home/home';
import { StationsPage } from '../stations/stations';

@Component({
  selector: 'page-community',
  templateUrl: 'community.html'
})
export class CommunityPage {

  constructor(public navCtrl: NavController, public navParams: NavParams, public viewCtrl: ViewController, public auth: AuthService) {}

  ionViewDidLoad() {

  }

  goBack() {
    this.navCtrl.pop();
  }
}
