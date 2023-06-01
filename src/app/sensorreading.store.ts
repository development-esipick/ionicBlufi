import { Injectable } from '@angular/core'
import { BehaviorSubject } from 'rxjs/BehaviorSubject'
import { Observable } from 'rxjs/Observable'
import 'rxjs/add/operator/map'
import 'rxjs/add/operator/concatAll'
import 'rxjs/add/operator/share'
import { List } from 'immutable'
import { ISensorReading } from './sensorreading.interface'
import { AuthService } from './auth.service'
import * as _orderBy from 'lodash.orderby'
import { Sigv4Http } from './sigv4.service'
import { Config } from 'ionic-angular'

let sensorReadingStoreFactory = (sigv4: Sigv4Http, auth: AuthService, config: Config) => { return new SensorReadingStore(sigv4, auth, config) }

export let SensorReadingStoreProvider = {
  provide: SensorReadingStore,
  useFactory: sensorReadingStoreFactory,
  deps: [Sigv4Http, AuthService]
}

@Injectable()
export class SensorReadingStore {

  private _sensorreadings: BehaviorSubject<List<ISensorReading>> = new BehaviorSubject(List([]))
  private endpoint:string

  constructor (private sigv4: Sigv4Http, private auth: AuthService, private config: Config) {
    this.endpoint = this.config.get('APIs')['sensorreadingsCRUD']
    
    this.auth.signoutNotification.subscribe(() => this._sensorreadings.next(List([])))
    this.auth.signinNotification.subscribe(() => this.refresh() )
    //this.refresh()
  }

  get sensorreadings () { return Observable.create( fn => this._sensorreadings.subscribe(fn) ) }

  refresh () : Observable<any> {
    if (this.auth.isUserSignedIn()) {
      let observable = this.auth.getCredentials().map(creds => this.sigv4.get(this.endpoint, 'sensorreadings', creds)).concatAll().share()
      observable.subscribe(resp => {
        console.log(resp)
        let data = resp.json()
        this._sensorreadings.next(List(this.sort(data.sensorreadings)))
      })
      return observable
    } else {
      this._sensorreadings.next(List([]))
      return Observable.from([])
    }
  }

  refreshSelectedSensorReadings (selectedSensorId) : Observable<any> {
    if (this.auth.isUserSignedIn()) {
      let observable = this.auth.getCredentials().map(creds => this.sigv4.get(this.endpoint, 'sensorreadings/' + selectedSensorId, creds)).concatAll().share()
      observable.subscribe(resp => {
        console.log(resp)
        let data = resp.json()
        this._sensorreadings.next(List(this.sort(data.sensorreadings)))
      })
      return observable
    } else {
      this._sensorreadings.next(List([]))
      return Observable.from([])
    }
  }  


  private sort (sensorreadings:ISensorReading[]): ISensorReading[] {
    return _orderBy(sensorreadings, ['readingDateTime'], ['asc']);
  }
}
