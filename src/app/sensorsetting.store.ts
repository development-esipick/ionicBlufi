import { Injectable } from '@angular/core'
import { BehaviorSubject } from 'rxjs/BehaviorSubject'
import { Observable } from 'rxjs/Observable'
import 'rxjs/add/operator/map'
import 'rxjs/add/operator/concatAll'
import 'rxjs/add/operator/share'
import { List } from 'immutable'
import { IUserSetting } from './usersetting.interface'
import { AuthService } from './auth.service'
import * as _orderBy from 'lodash.orderby'
import { Sigv4Http } from './sigv4.service'
import { Config } from 'ionic-angular'

let userSettingStoreFactory = (sigv4: Sigv4Http, auth: AuthService, config: Config) => { return new UserSettingStore(sigv4, auth, config) }

export let UserSettingStoreProvider = {
  provide: UserSettingStore,
  useFactory: userSettingStoreFactory,
  deps: [Sigv4Http, AuthService]
}


@Injectable()
export class UserSettingStore {

  private _userSettings: BehaviorSubject<List<IUserSetting>> = new BehaviorSubject(List([]))
  private endpoint:string

  constructor (private sigv4: Sigv4Http, private auth: AuthService, private config: Config) {
    this.endpoint = this.config.get('APIs')['usersettingsCRUD']
    
    this.auth.signoutNotification.subscribe(() => this._userSettings.next(List([])))
    this.auth.signinNotification.subscribe(() => this.refresh() )
    //this.refresh()
  }

  get userSettings () { return Observable.create( fn => this._userSettings.subscribe(fn) ) }

  refresh () : Observable<any> {
    if (this.auth.isUserSignedIn()) {
      let observable = this.auth.getCredentials().map(creds => this.sigv4.get(this.endpoint, 'usersettings', creds)).concatAll().share();

      observable.subscribe(resp => {
        if (resp.status === 200) {          
          console.log(resp)                    
        }
      });

      return observable.map(resp => resp.status === 200 ? resp.json().usersettings[0] : null)

    } else {
      this._userSettings.next(List([]));
      return Observable.from([]);
    }
  }

  addUserSetting (userSetting): Observable<IUserSetting> {
    let observable = this.auth.getCredentials().map(creds => this.sigv4.post(this.endpoint, 'usersettings', userSetting, creds)).concatAll().share()

    observable.subscribe(resp => {
      if (resp.status === 200) {
        console.log(resp)
        let userSettings = this._userSettings.getValue().toArray()
        let userSetting = resp.json().usersetting
        userSettings.push(userSetting)
        this._userSettings.next(List(this.sort(userSettings)))
      }
    })
    return observable.map(resp => resp.status === 200 ? resp.json().usersettings[0] : null)
  }

  editUserSetting (userSetting): Observable<IUserSetting> {
    let observable = this.auth.getCredentials().map(creds => this.sigv4.post(this.endpoint, 'usersettings', userSetting, creds)).concatAll().share()

    observable.subscribe(resp => {
      if (resp.status === 200) {
        console.log(resp)
        let userSettings = this._userSettings.getValue().toArray()
        let userSetting = resp.json().data
        
        this._userSettings.next(List(this.sort(userSetting)))
      }
    })
    return observable.map(resp => resp.status === 200 ? resp.json().data : null)
  }

  deleteUserSetting (index): Observable<IUserSetting> {
    let userSettings = this._userSettings.getValue().toArray()
    let obs = this.auth.getCredentials().map(creds => this.sigv4.del(this.endpoint, `usersettings/${userSettings[index].userId}`, creds)).concatAll().share()

    obs.subscribe(resp => {
      if (resp.status === 200) {
        userSettings.splice(index, 1)[0]
        this._userSettings.next(List(<IUserSetting[]>userSettings))
      }
    })
    return obs.map(resp => resp.status === 200 ? resp.json().usersettings : null)
  }

  private sort (userSettings:IUserSetting[]): IUserSetting[] {
    return _orderBy(userSettings, ['userId'], ['asc'])
  }
}
