import { Component } from '@angular/core'
import { NavController, NavParams, ViewController } from 'ionic-angular'
import { AuthService } from '../../app/auth.service'
import { StationsPage } from '../stations/stations';
import { LoginPage } from '../login/login';
import { Facebook, FacebookLoginResponse } from '@ionic-native/facebook';
import { Http, Headers, RequestOptions, URLSearchParams } from '@angular/http';
 
@Component({
  selector: 'page-facebooklogin',
  templateUrl: 'facebooklogin.html'
})
export class FacebookLoginPage {

  page: string = 'login'
  credentials: Credentials = {}
  message: string
  error: string
  COGNITO_POOL_URL : string  = 'https://simplesensordev.auth.us-east-1.amazoncognito.com';
  COGNITO_CLIENT_ID : string = '1gqas84rggpliqalhjvqjvmuat';

  constructor(public navCtrl: NavController, public navParams: NavParams, public viewCtrl: ViewController, public auth: AuthService, private fb: Facebook, private http : Http) {
    this.page = navParams.get('page');
  }

  ionViewDidLoad() {
    this.fb.login(['public_profile', 'email'])
      .then((response: FacebookLoginResponse) => {

        
        console.log(JSON.stringify(response));
        if (response.status === 'connected' && response.authResponse) {              

          console.log('Logged into Facebook!');

          let p = new Promise((resolve, reject) => {
            this.fb.api('me?fields=email,name', null).then(
            (profileData) => {
                console.log(JSON.stringify(profileData));
                this.credentials.username = 'Facebook_' + profileData.id;
                this.credentials.email = profileData.email;
                this.credentials.facebookId = profileData.id;

                this.auth.makeFacebookCredentials(response.authResponse.accessToken, this.credentials);
                //this.oauthRequestToken(response.authResponse.accessToken);

                //resolve(profileData);
            },(err) => {
                console.log(JSON.stringify(err));
                //reject(err);
            });
        });
          

        } else if (response.status === 'not_authorized') {
          document.getElementById('status').innerHTML = 'Please log into this app.';
        } else {
          document.getElementById('status').innerHTML = 'Please log into Facebook.';
        }
          
      }
      )
      .catch(e => {
        console.log('Error logging into Facebook', e);
        this.navCtrl.setRoot(LoginPage, {
          page: 'login'
        });
        }
      );
  }

  oauthRequestToken(authorization_code){
    var headers = new Headers();
    headers.append('Content-Type', 'application/x-www-form-urlencoded' );
    let options = new RequestOptions({ headers: headers });
    let body = new URLSearchParams();
    body.set('grant_type','authorization_code');
    body.set('client_id',this.COGNITO_CLIENT_ID);
    body.set('redirect_uri','http://localhost:8100' );
    body.set('code',authorization_code);
    let postParams = {
      grant_type: 'authorization_code',
      client_id: this.COGNITO_CLIENT_ID,
      redirect_uri: 'http://localhost:8100/',
      code : authorization_code
    }
    //postParams = [{"key":"grant_type","value":"authorization_code"},{"key":"client_id","value":this.COGNITO_CPLIENT_ID},{"key":"redirect_uri","value":"https://www.amazon.com"},{"key":"code","value":authorization_code}];
    this.http.post(this.COGNITO_POOL_URL + "/oauth2/token", body.toString(), options)
      .subscribe(data => {
        try{
          console.log(data.json());
          
        }catch(error){
          console.log('error1: ' + error.text());
        }
       }, error => {
        console.log('error2: ' + error.text());
      });
  }  

  signin () {
    this.reset();
    this.auth.signin(this.credentials).then((user) => {
      this.navCtrl.setRoot(StationsPage)
    }).catch((err) => {
      console.log('error signing in', err)
      this.setError(err.message)
    })
  }

  register () {
    this.reset();
    this.auth.register(this.credentials).then((user) => {
      console.log('register: success', user)
      this.page = 'confirm'
    }).catch((err) => {
      console.log('error registering', err)
      this.setError(err.message)
    })
  }

  confirm () {
    this.reset();
    this.auth.confirm(this.credentials).then((user) => {
      this.page = 'login'
      this.setMessage('You have been confirmed. Please sign in.')
    }).catch((err) => {
      console.log('error confirming', err)
      this.setError(err.message)
    })
  }

  private setMessage(msg) {
     this.message = msg
     this.error = null
  }

  private setError(msg) {
     this.error = msg
     this.message = null
  }

  dismiss () { this.viewCtrl.dismiss() }

  reset () { this.error = null; this.message = null; }

  showConfirmation () { this.page = 'confirm' }
  showRegistration () { this.page = 'register' }
  showLogin () { this.page = 'login'}
}

interface Credentials {
  username?: string
  email?: string
  password?: string
  confcode?: string
  facebookId?: string
}
