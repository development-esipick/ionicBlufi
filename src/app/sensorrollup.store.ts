import { Injectable } from '@angular/core'
import { BehaviorSubject } from 'rxjs/BehaviorSubject'
import { Observable } from 'rxjs/Observable'
import 'rxjs/add/operator/map'
import 'rxjs/add/operator/concatAll'
import 'rxjs/add/operator/share'
import { List } from 'immutable'
import { ISensorRollup } from './sensorrollup.interface'
import { AuthService } from './auth.service'
import * as _orderBy from 'lodash.orderby'
import { Sigv4Http } from './sigv4.service'
import { Config } from 'ionic-angular'

let sensorRollupStoreFactory = (sigv4: Sigv4Http, auth: AuthService, config: Config) => { return new SensorRollupStore(sigv4, auth, config) }

export let SensorRollupStoreProvider = {
  provide: SensorRollupStore,
  useFactory: sensorRollupStoreFactory,
  deps: [Sigv4Http, AuthService]
}

@Injectable()
export class SensorRollupStore {

  private _sensorrollups: BehaviorSubject<List<ISensorRollup>> = new BehaviorSubject(List([]))
  private endpoint:string
  private endpointfifteen:string
  private endpointonehour:string
  private endpointthreehour:string

  constructor (private sigv4: Sigv4Http, private auth: AuthService, private config: Config) {
    this.endpoint = this.config.get('APIs')['sensoroneminuterollupsCRUD']
    this.endpointfifteen = this.config.get('APIs')['sensorfifteenminuterollupsCRUD']
    this.endpointonehour = this.config.get('APIs')['sensoronehourrollupsCRUD']
    this.endpointthreehour = this.config.get('APIs')['sensorthreehourrollupsCRUD']
    
    this.auth.signoutNotification.subscribe(() => this._sensorrollups.next(List([])))
    this.auth.signinNotification.subscribe(() => this.refresh() )
    //this.refresh()
  }

  get sensorrollups () { return Observable.create( fn => this._sensorrollups.subscribe(fn) ) }

  refresh () : Observable<any> {
    if (this.auth.isUserSignedIn()) {
      let observable = this.auth.getCredentials().map(creds => this.sigv4.get(this.endpoint, 'sensoroneminuterollups', creds)).concatAll().share()
      observable.subscribe(resp => {
        console.log(resp)
        let data = resp.json()
        this._sensorrollups.next(List(this.sort(data.sensorrollups)))
      })
      return observable
    } else {
      this._sensorrollups.next(List([]))
      return Observable.from([])
    }
  }

  refreshSelectedSensorRollups (selectedSensorId) : Observable<any> {
    if (this.auth.isUserSignedIn()) {
      this._sensorrollups.next(List([]))
      let observable = this.auth.getCredentials().map(creds => this.sigv4.get(this.endpoint, 'sensoroneminuterollups/' + selectedSensorId, creds)).concatAll().share()
      observable.subscribe(resp => {
        console.log(resp)
        let data = resp.json()
        this._sensorrollups.next(List(this.sort(data.sensorrollups)))
      })
      return observable
    } else {
      this._sensorrollups.next(List([]))
      return Observable.from([])
    }
  }  

  selectedSensor1wRollups (selectedSensorId) : Observable<any> {
    if (this.auth.isUserSignedIn()) {
      this._sensorrollups.next(List([]))
      let observable = this.auth.getCredentials().map(creds => this.sigv4.get(this.endpointfifteen, 'sensorfifteenminuterollups/' + selectedSensorId, creds)).concatAll().share()
      observable.subscribe(resp => {
        console.log(resp)
        let data = resp.json()
        this._sensorrollups.next(List(this.sort(data.sensorrollups)))
      })
      return observable
    } else {
      this._sensorrollups.next(List([]))
      return Observable.from([])
    }
  }

  selectedSensor1mRollups (selectedSensorId) : Observable<any> {
    if (this.auth.isUserSignedIn()) {
      this._sensorrollups.next(List([]))
      let observable = this.auth.getCredentials().map(creds => this.sigv4.get(this.endpointfifteen, 'sensorfifteenminuterollups/1m/' + selectedSensorId, creds)).concatAll().share()
      observable.subscribe(resp => {
        console.log(resp)
        let data = resp.json()
        this._sensorrollups.next(List(this.sort(data.sensorrollups)))
      })
      return observable
    } else {
      this._sensorrollups.next(List([]))
      return Observable.from([])
    }
  }  

  selectedSensor3mRollups (selectedSensorId) : Observable<any> {
    if (this.auth.isUserSignedIn()) {
      this._sensorrollups.next(List([]))
      let observable = this.auth.getCredentials().map(creds => this.sigv4.get(this.endpointonehour, 'sensoronehourrollups/' + selectedSensorId, creds)).concatAll().share()
      observable.subscribe(resp => {
        console.log(resp)
        let data = resp.json()
        this._sensorrollups.next(List(this.sort(data.sensorrollups)))
      })
      return observable
    } else {
      this._sensorrollups.next(List([]))
      return Observable.from([])
    }
  }    

  selectedSensor6mRollups (selectedSensorId) : Observable<any> {
    if (this.auth.isUserSignedIn()) {
      this._sensorrollups.next(List([]))
      let observable = this.auth.getCredentials().map(creds => this.sigv4.get(this.endpointonehour, 'sensoronehourrollups/6m/' + selectedSensorId, creds)).concatAll().share()
      observable.subscribe(resp => {
        console.log(resp)
        let data = resp.json()
        this._sensorrollups.next(List(this.sort(data.sensorrollups)))
      })
      return observable
    } else {
      this._sensorrollups.next(List([]))
      return Observable.from([])
    }
  }   

  selectedSensor1yRollups (selectedSensorId) : Observable<any> {
    if (this.auth.isUserSignedIn()) {
      this._sensorrollups.next(List([]))
      let observable = this.auth.getCredentials().map(creds => this.sigv4.get(this.endpointthreehour, 'sensorthreehourrollups/' + selectedSensorId, creds)).concatAll().share()
      observable.subscribe(resp => {
        console.log(resp)
        let data = resp.json()
        this._sensorrollups.next(List(this.sort(data.sensorrollups)))
      })
      return observable
    } else {
      this._sensorrollups.next(List([]))
      return Observable.from([])
    }
  }       

  private sort (sensorrollups:ISensorRollup[]): ISensorRollup[] {
    return _orderBy(sensorrollups, ['ttl'], ['asc']);
  }
}
