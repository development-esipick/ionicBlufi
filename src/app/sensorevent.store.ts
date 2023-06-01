import { Injectable } from '@angular/core'
import { BehaviorSubject } from 'rxjs/BehaviorSubject'
import { Observable } from 'rxjs/Observable'
import 'rxjs/add/operator/map'
import 'rxjs/add/operator/concatAll'
import 'rxjs/add/operator/share'
import { List } from 'immutable'
import { ISensorEvent } from './sensorevent.interface'
import { AuthService } from './auth.service'
import * as _orderBy from 'lodash.orderby'
import { Sigv4Http } from './sigv4.service'
import { Config } from 'ionic-angular'

let sensorEventStoreFactory = (sigv4: Sigv4Http, auth: AuthService, config: Config) => { return new SensorEventStore(sigv4, auth, config) }

export let SensorEventStoreProvider = {
  provide: SensorEventStore,
  useFactory: sensorEventStoreFactory,
  deps: [Sigv4Http, AuthService]
}

@Injectable()
export class SensorEventStore {

  private _sensorevents: BehaviorSubject<List<ISensorEvent>> = new BehaviorSubject(List([]))
  private endpoint:string

  constructor (private sigv4: Sigv4Http, private auth: AuthService, private config: Config) {
    this.endpoint = this.config.get('APIs')['sensoreventsCRUD']
    
    this.auth.signoutNotification.subscribe(() => this._sensorevents.next(List([])))
    this.auth.signinNotification.subscribe(() => this.refresh() )
    //this.refresh()
  }

  get sensorevents () { return Observable.create( fn => this._sensorevents.subscribe(fn) ) }

  refresh () : Observable<any> {
    if (this.auth.isUserSignedIn()) {
      let observable = this.auth.getCredentials().map(creds => this.sigv4.get(this.endpoint, 'sensorevents', creds)).concatAll().share()
      observable.subscribe(resp => {
        console.log(resp)
        let data = resp.json()
        this._sensorevents.next(List(this.sort(data.sensorevents)))
      })
      return observable
    } else {
      this._sensorevents.next(List([]))
      return Observable.from([])
    }
  }

  refreshSelectedSensorEvents (selectedSensorId) : Observable<any> {
    if (this.auth.isUserSignedIn()) {
      let observable = this.auth.getCredentials().map(creds => this.sigv4.get(this.endpoint, 'sensorevents/' + selectedSensorId, creds)).concatAll().share()
      observable.subscribe(resp => {
        console.log(resp)
        let data = resp.json()
        this._sensorevents.next(List(this.sort(data.sensorevents)))
      })
      return observable
    } else {
      this._sensorevents.next(List([]))
      return Observable.from([])
    }
  }  


  private sort (sensorevents:ISensorEvent[]): ISensorEvent[] {
    return _orderBy(sensorevents, ['eventDateTime'], ['desc']);
  }
}
