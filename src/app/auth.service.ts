import { Injectable } from '@angular/core'
import { Config as AppConfig } from 'ionic-angular'

import { CognitoUser, CognitoUserPool, CognitoUserAttribute, AuthenticationDetails , ICognitoUserPoolData , CognitoUserSession, CognitoIdToken, CognitoAccessToken, CognitoRefreshToken } from  'amazon-cognito-identity-js'

import { Subject } from 'rxjs/Subject'
import { Observable } from 'rxjs/Observable'
import 'rxjs/add/observable/from'
import 'rxjs/add/operator/map'
import 'rxjs/add/operator/concatAll'
import 'rxjs/add/operator/share'

import { Http, Headers, RequestOptions, URLSearchParams } from '@angular/http';
import { Sigv4Http } from './sigv4.service'

let authServiceFactory = (sigv4: Sigv4Http, config: AppConfig, http: Http) => { return new AuthService(sigv4, config, http) }

export let AuthServiceProvider = {
  provide: AuthService,
  useFactory: authServiceFactory,
  deps: [Sigv4Http, AppConfig]
}

declare var AWS: any;

@Injectable()
export class AuthService {
  private unauthCreds: any
  private poolData: ICognitoUserPoolData
  private userPool: CognitoUserPool
  private _cognitoUser: CognitoUser
  private session: CognitoUserSession
  private _signoutSubject: Subject<string> = new Subject<string>()
  private _signinSubject: Subject<string> = new Subject<string>()

  constructor(private sigv4: Sigv4Http, private config: AppConfig, private http : Http) {
    AWS.config.region = this.config.get('region')
    this.poolData = { UserPoolId: this.config.get('userPoolId'), ClientId: this.config.get('appId') }
    this.userPool = new CognitoUserPool(this.poolData)
    this.refreshOrResetCreds()
  }

  get signoutNotification () { return Observable.create( fn => this._signoutSubject.subscribe(fn) ) }
  get signinNotification () { return Observable.create( fn => this._signinSubject.subscribe(fn) ) }
  get cognitoUser (): CognitoUser { return this._cognitoUser }
  get currentIdentity (): string { return AWS.config.credentials.identityId }
  get currentEmail (): string { return AWS.config.credentials.email }
  isUserSignedIn (): boolean { return this._cognitoUser !== null }

  private refreshOrResetCreds () {
    this._cognitoUser = this.userPool.getCurrentUser()

    if (this._cognitoUser !== null) {
      this.refreshSession()
    } else {
      this.resetCreds()
    }
  }

  private setCredentials(newCreds) {
    AWS.config.credentials = newCreds;
    if (this._cognitoUser)
    {
      this.updateCustomAttributes();
    }
    
  }

  private buildLogins (token) {
    let key = this.config.get('idpURL') + '/' + this.config.get('userPoolId')
    let json = { IdentityPoolId: this.config.get('identityPool'), Logins: {} }
    json.Logins[key] = token
    return json
  }

  private buildCreds () {
    let json = this.buildLogins(this.session.getIdToken().getJwtToken())
    return new AWS.CognitoIdentityCredentials(json)
  }

  private saveCreds (session, cognitoUser?): void {
    this.session = session
    if (cognitoUser) 
    {
      this._cognitoUser = cognitoUser       
    }

    this.setCredentials(this.buildCreds());    
  }

  private getNewCognitoUser (creds): CognitoUser {
    return new CognitoUser({ Username: creds.username, Pool: this.userPool })
  }

  private authDetails (creds): AuthenticationDetails {
    return new AuthenticationDetails({Username: creds.username, Password: creds.password})
  }

  private refreshSession (): Promise<CognitoUserSession> {
    let self = this
    return new Promise ((resolve, reject) => {
      self._cognitoUser.getSession((err, session) => {
        if (err) {
          console.log('Error refreshing user session', err); 
          //return reject(err);
          self.signout();
        }

        console.log(`${new Date()} - Refreshed session for ${self._cognitoUser.getUsername()}. Valid?: `, session.isValid())
        self.saveCreds(session)
        resolve(session)        
      })
    })
  }

  private updateCustomAttributes()
  {    
    if (this._cognitoUser && AWS.config.credentials.identityId)
    {
      var attributeList = [];
      var attribute = {
          Name : 'nickname',
          Value : AWS.config.credentials.identityId
      };
      var cogattribute = new CognitoUserAttribute(attribute);
      attributeList.push(cogattribute);

      this._cognitoUser.updateAttributes(attributeList, function(err, result) {
          if (err) {
              console.log('updateCustomAttributes error: ' + err);
              return;
          }
          console.log('updateCustomAttributes call result: ' + result);
      });    
    }
  }

  private resetCreds (clearCache:boolean = false) {
    console.log('Resetting credentials for unauth access')
    AWS.config.region = this.config.get('region')
    this._cognitoUser = null
    this.unauthCreds = this.unauthCreds || new AWS.CognitoIdentityCredentials({ IdentityPoolId: this.config.get('identityPool') })
    if (clearCache){ this.unauthCreds.clearCachedId() }
    this.setCredentials(this.unauthCreds)
  }

  private buildAttributes (creds): Array<CognitoUserAttribute> {
    let attributeList = []
    let attributeEmail = new CognitoUserAttribute({Name: 'email', Value: creds.email})
    let attributeName = new CognitoUserAttribute({Name: 'preferred_username', Value: creds.username})
    attributeList.push(attributeEmail)
    attributeList.push(attributeName)
    return attributeList
  }

  private _getCreds (): Promise<any> {
    return new Promise((resolve, reject) => {
      try {
        AWS.config.credentials.get((err) => {
          if (err) { return reject(err) }
          resolve(AWS.config.credentials)
        })
      } catch (e) { reject(e) }
    })
  }

  getCredentials (): Observable<any> {
    let result = null
    if (this._cognitoUser === null) { result =  this._getCreds() }
    else if (this.session && this.session.isValid()) { result = this._getCreds() }
    else { result = this.refreshSession().then(this._getCreds) }
    return Observable.from(result)
  }

  getFacebookCredentials (): Observable<any> {
    let result = this._getCreds()
    return Observable.from(result);
  }

  signout () {
    if (this._cognitoUser) {
      let name = this._cognitoUser.getUsername()
      this._cognitoUser['signOut']()
      this.resetCreds(true)
      this._signoutSubject.next(name)
    }
  }

  register (creds): Promise<CognitoUser> {
    let self = this
    return new Promise((resolve, reject) => {
      try {
        self.userPool.signUp(creds.username, creds.password, self.buildAttributes(creds), null, (err, result) => {
          if (err) { return reject(err) }
          console.log('Register', result)
          resolve(result.user)
        })
      } catch (e) { reject(e) }
    })
  }

  confirm (creds): Promise<CognitoUser> {
    let cognitoUser = this.getNewCognitoUser(creds)
    return new Promise((resolve, reject) => {
      try {
        console.log('Confirming...', CognitoUser)
        cognitoUser.confirmRegistration(creds.confcode, true, (err, result) => {
          if (err) { return reject(err) }
          resolve(result.CognitoUser)
        })
      } catch (e) { reject(e) }
    })
  }

  signin (creds): Promise<CognitoUser> {
    let cognitoUser = this.getNewCognitoUser(creds)
    let self = this
    return new Promise((resolve, reject) => {
      try {
        cognitoUser.authenticateUser(self.authDetails(creds), {
          onSuccess: (session) => {
            console.log(`Signed in user ${cognitoUser.getUsername()}. Sessiong valid?: `, session.isValid())            
            self.saveCreds(session, cognitoUser)
            self._signinSubject.next(cognitoUser.getUsername())
            resolve(cognitoUser)            
          },
          newPasswordRequired: (userAttributes, requiredAttributes) => {},
          mfaRequired: (challengeName, challengeParameters) => {},
          customChallenge: (challengeParameters) => {},
          onFailure: reject
        })
      } catch (e) { reject(e) }
    })
  }

  forgotPassword(username): Promise<CognitoUser> {

      // setup cognitoUser first
      let cUser = new CognitoUser({
          Username: username,
          Pool: this.userPool
      });

      // call forgotPassword on cognitoUser
      return new Promise((resolve, reject) => {
        try 
        {
          cUser.forgotPassword({
              onSuccess: function(result) {
                  console.log('forgot password call result: ' + result);
                  resolve(cUser);
              },
              onFailure: function(err) {
                  reject(err)
              },
              inputVerificationCode() { 
                  console.log('inputVerificationCode');
                  resolve(cUser);
              }
          });
        } catch (e) { reject(e) }
      });
  }

  resetForgotPassword(username, verificationCode, newPassword) {
      let cUser = new CognitoUser({
          Username: username,
          Pool: this.userPool
      });

      return new Promise((resolve, reject) => {
          cUser.confirmPassword(verificationCode, newPassword, {
              onFailure(err) {
                  reject(err);
              },
              onSuccess() {
                  resolve();
              },
          });
      });
  }    

  makeFacebookCredentials(idToken, creds) {
    let self = this;
    AWS.config.credentials = new AWS.CognitoIdentityCredentials({
      IdentityPoolId: this.config.get('identityPool'),
      Logins: { 'graph.facebook.com': idToken }
    });

    AWS.config.credentials.get(function(err) {
      if (err) 
      {
        return console.log("Facebook Auth Error", err);
      }
      else
      {

        console.log("Cognito Identity Id", AWS.config.credentials.identityId);
        console.log(AWS.config.credentials.data);

        self._cognitoUser = self.getNewCognitoUser(creds);
        console.log('do something here');

        let observable = self.sigv4.get('https://w8fz8ra3g0.execute-api.us-east-1.amazonaws.com/Development', 'stations', AWS.config.credentials)
        console.log('awaiting response');
        observable.subscribe(resp => {          
          console.log('stations response: ' + resp);          
          console.log(resp.json());


          var cognitoidentity = new AWS.CognitoIdentity();
          var params = {
            IdentityId: AWS.config.credentials.identityId, 
            Logins: {
              'graph.facebook.com': idToken
            }
          };
          cognitoidentity.getOpenIdToken(params, function(err, data) {
            if (err) console.log(err, err.stack); // an error occurred
            else 
            {
                
                var tokenData = data.Token.split(".");
                console.log(tokenData[0]);
                const idToken = new CognitoIdToken(tokenData[0]);
                const accessToken = new CognitoAccessToken(tokenData[1]);
                const refreshToken = new CognitoRefreshToken(tokenData[2]);

                const sessionData = {
                  IdToken: idToken,
                  AccessToken: accessToken,
                  RefreshToken: refreshToken
                };
                console.log(sessionData);

                self.session = new CognitoUserSession(sessionData);
                self._cognitoUser.setSignInUserSession(self.session);
                self.saveCreds(self.session, self._cognitoUser)
                self._signinSubject.next(self._cognitoUser.getUsername())
            }
          });

          //self.refreshSession();

        });                                  
      }

    });
  }
}

