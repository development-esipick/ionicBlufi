import { Injectable } from '@angular/core'
import { BehaviorSubject } from 'rxjs/BehaviorSubject'
import { Observable } from 'rxjs/Observable'
import 'rxjs/add/operator/map'
import 'rxjs/add/operator/concatAll'
import 'rxjs/add/operator/share'
import { List } from 'immutable'
import { IRawSensorData } from './rawsensordata.interface'
import { AuthService } from './auth.service'
import * as _orderBy from 'lodash.orderby'
import { Sigv4Http } from './sigv4.service'
import { Config } from 'ionic-angular'

let rawSensorDataStoreFactory = (sigv4: Sigv4Http, auth: AuthService, config: Config) => { return new RawSensorDataStore(sigv4, auth, config) }

export let RawSensorDataStoreProvider = {
  provide: RawSensorDataStore,
  useFactory: rawSensorDataStoreFactory,
  deps: [Sigv4Http, AuthService]
}

@Injectable()
export class RawSensorDataStore {

  private _rawsensordatas: BehaviorSubject<List<IRawSensorData>> = new BehaviorSubject(List([]))
  private endpoint:string

  constructor (private sigv4: Sigv4Http, private auth: AuthService, private config: Config) {

    this.endpoint = this.config.get('APIs')['rawsensordata2CRUD']
    
    this.auth.signoutNotification.subscribe(() => this._rawsensordatas.next(List([])))
    this.auth.signinNotification.subscribe(() => this.refresh() )
    //this.refresh()
  }

  get rawsensordatas () { return Observable.create( fn => this._rawsensordatas.subscribe(fn) ) }

  refresh () : Observable<any> {
    if (this.auth.isUserSignedIn()) {
      let observable = this.auth.getCredentials().map(creds => this.sigv4.get(this.endpoint, 'rawsensordata2', creds)).concatAll().share()
      observable.subscribe(resp => {
        console.log(resp)
        let data = resp.json()
        this._rawsensordatas.next(List(this.sort(data.sensors)))
      })
      return observable
    } else {
      this._rawsensordatas.next(List([]))
      return Observable.from([])
    }
  }

  refreshSelectedRawSensorData (selectedSensorId) : Observable<any> {
    if (this.auth.isUserSignedIn()) {
      
      let observable = this.auth.getCredentials().map(creds => this.sigv4.get(this.endpoint, 'rawsensordata2/object/' + selectedSensorId, creds)).concatAll().share()

      observable.subscribe(resp => {
        if (resp.status === 200) {
          
          console.log(resp)
                    
        }
      })

      return observable.map(resp => resp.status === 200 ? resp.json() : null)
    }
  }  

  private sort (rawsensordatas:IRawSensorData[]): IRawSensorData[] {
    return _orderBy(rawsensordatas, ['sensorId', 'timestamp'], ['asc', 'asc'])
  }
}
