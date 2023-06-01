import { Injectable } from '@angular/core'
import { BehaviorSubject } from 'rxjs/BehaviorSubject'
import { Observable } from 'rxjs/Observable'
import 'rxjs/add/operator/map'
import 'rxjs/add/operator/concatAll'
import 'rxjs/add/operator/share'
import { List } from 'immutable'
import { IStationSetting } from './stationsetting.interface'
import { AuthService } from './auth.service'
import * as _orderBy from 'lodash.orderby'
import { Sigv4Http } from './sigv4.service'
import { Config } from 'ionic-angular'

let stationSettingStoreFactory = (sigv4: Sigv4Http, auth: AuthService, config: Config) => { return new StationSettingStore(sigv4, auth, config) }

export let StationSettingStoreProvider = {
  provide: StationSettingStore,
  useFactory: stationSettingStoreFactory,
  deps: [Sigv4Http, AuthService]
}


@Injectable()
export class StationSettingStore {

  private _stationSettings: BehaviorSubject<List<IStationSetting>> = new BehaviorSubject(List([]))
  private endpoint:string

  constructor (private sigv4: Sigv4Http, private auth: AuthService, private config: Config) {
    this.endpoint = this.config.get('APIs')['stationsettingsCRUD']
    
    this.auth.signoutNotification.subscribe(() => this._stationSettings.next(List([])))
    this.auth.signinNotification.subscribe(() => this.refresh() )
    //this.refresh()
  }

  get stationSettings () { return Observable.create( fn => this._stationSettings.subscribe(fn) ) }

  refresh () : Observable<any> {
    if (this.auth.isUserSignedIn()) {
      let observable = this.auth.getCredentials().map(creds => this.sigv4.get(this.endpoint, 'stationsettings', creds)).concatAll().share();

      observable.subscribe(resp => {
        if (resp.status === 200) {          
          console.log(resp)                    
        }
      });

      return observable.map(resp => resp.status === 200 ? resp.json().stationsettings[0] : null)

    } else {
      this._stationSettings.next(List([]));
      return Observable.from([]);
    }
  }

  refreshSelectedStationSettings (stationId) : Observable<any> {
    if (this.auth.isUserSignedIn()) {
      let observable = this.auth.getCredentials().map(creds => this.sigv4.get(this.endpoint, 'stationsettings/object/' + stationId, creds)).concatAll().share();

      observable.subscribe(resp => {
        if (resp.status === 200) {          
          console.log(resp)                    
        }
      });

      return observable.map(resp => resp.status === 200 ? resp.json().stationsettings : null)

    } else {
      this._stationSettings.next(List([]));
      return Observable.from([]);
    }
  }  

  addStationSetting (stationSetting): Observable<IStationSetting> {
    let observable = this.auth.getCredentials().map(creds => this.sigv4.post(this.endpoint, 'stationsettings', stationSetting, creds)).concatAll().share()

    observable.subscribe(resp => {
      if (resp.status === 200) {
        console.log(resp)
        let stationSettings = this._stationSettings.getValue().toArray()
        let stationSetting = resp.json().stationsetting
        stationSettings.push(stationSetting)
        this._stationSettings.next(List(this.sort(stationSettings)))
      }
    })
    return observable.map(resp => resp.status === 200 ? resp.json().stationsettings[0] : null)
  }

  editStationSetting (stationSetting): Observable<IStationSetting> {
    let observable = this.auth.getCredentials().map(creds => this.sigv4.post(this.endpoint, 'stationsettings', stationSetting, creds)).concatAll().share()

    observable.subscribe(resp => {
      if (resp.status === 200) {
        console.log(resp)
        let stationSettings = this._stationSettings.getValue().toArray()
        let stationSetting = resp.json().data
        
        this._stationSettings.next(List(this.sort(stationSetting)))
      }
    })
    return observable.map(resp => resp.status === 200 ? resp.json().data : null)
  }

  deleteStationSetting (index): Observable<IStationSetting> {
    let stationSettings = this._stationSettings.getValue().toArray()
    let obs = this.auth.getCredentials().map(creds => this.sigv4.del(this.endpoint, `stationsettings/${stationSettings[index].userId}`, creds)).concatAll().share()

    obs.subscribe(resp => {
      if (resp.status === 200) {
        stationSettings.splice(index, 1)[0]
        this._stationSettings.next(List(<IStationSetting[]>stationSettings))
      }
    })
    return obs.map(resp => resp.status === 200 ? resp.json().stationsettings : null)
  }

  private sort (stationSettings:IStationSetting[]): IStationSetting[] {
    return _orderBy(stationSettings, ['userId'], ['asc'])
  }
}
