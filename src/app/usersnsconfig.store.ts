import { Injectable } from '@angular/core'
import { BehaviorSubject } from 'rxjs/BehaviorSubject'
import { Observable } from 'rxjs/Observable'
import 'rxjs/add/operator/map'
import 'rxjs/add/operator/concatAll'
import 'rxjs/add/operator/share'
import { List } from 'immutable'
import { IUserSNSConfig } from './usersnsconfig.interface'
import { AuthService } from './auth.service'
import * as _orderBy from 'lodash.orderby'
import { Sigv4Http } from './sigv4.service'
import { Config } from 'ionic-angular'

let usersnsconfigStoreFactory = (sigv4: Sigv4Http, auth: AuthService, config: Config) => { return new UserSNSConfigStore(sigv4, auth, config) }

export let UserSNSConfigStoreProvider = {
  provide: UserSNSConfigStore,
  useFactory: usersnsconfigStoreFactory,
  deps: [Sigv4Http, AuthService]
}

@Injectable()
export class UserSNSConfigStore {

  private _usersnsconfigs: BehaviorSubject<List<IUserSNSConfig>> = new BehaviorSubject(List([]))
  private endpoint:string

  constructor (private sigv4: Sigv4Http, private auth: AuthService, private config: Config) {
    this.endpoint = this.config.get('APIs')['usersnsconfigsCRUD']
    
    this.auth.signoutNotification.subscribe(() => this._usersnsconfigs.next(List([])))
    this.auth.signinNotification.subscribe(() => this.refresh() )
    this.refresh()
  }

  get usersnsconfigs () { return Observable.create( fn => this._usersnsconfigs.subscribe(fn) ) }

  refresh () : Observable<any> {
    if (this.auth.isUserSignedIn()) {
      let observable = this.auth.getCredentials().map(creds => this.sigv4.get(this.endpoint, 'usersnsconfigs', creds)).concatAll().share()
      observable.subscribe(resp => {
        console.log(resp)
        let data = resp.json()
        this._usersnsconfigs.next(List(this.sort(data.usersnsconfigs)))
      })
      return observable
    } else {
      this._usersnsconfigs.next(List([]))
      return Observable.from([])
    }
  }

  addUserSNSConfig (usersnsconfig): Observable<IUserSNSConfig> {
    let observable = this.auth.getCredentials().map(creds => this.sigv4.post(this.endpoint, 'usersnsconfigs', usersnsconfig, creds)).concatAll().share()

    observable.subscribe(resp => {
      if (resp.status === 200) {
        console.log(resp)
        let usersnsconfigs = this._usersnsconfigs.getValue().toArray()
        let usersnsconfig = resp.json().usersnsconfig
        usersnsconfigs.push(usersnsconfig)
        this._usersnsconfigs.next(List(this.sort(usersnsconfigs)))
      }
    })
    return observable.map(resp => resp.status === 200 ? resp.json().usersnsconfig : null)
  }

  deleteUserSNSConfig (index): Observable<IUserSNSConfig> {
    let usersnsconfigs = this._usersnsconfigs.getValue().toArray()
    let obs = this.auth.getCredentials().map(creds => this.sigv4.del(this.endpoint, `usersnsconfigs/${usersnsconfigs[index].deviceId}`, creds)).concatAll().share()

    obs.subscribe(resp => {
      if (resp.status === 200) {
        usersnsconfigs.splice(index, 1)[0]
        this._usersnsconfigs.next(List(<IUserSNSConfig[]>usersnsconfigs))
      }
    })
    return obs.map(resp => resp.status === 200 ? resp.json().usersnsconfig : null)
  }

  private sort (usersnsconfigs:IUserSNSConfig[]): IUserSNSConfig[] {
    return _orderBy(usersnsconfigs, ['createdOn'], ['asc'])
  }
}
