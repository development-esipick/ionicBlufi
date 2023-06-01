import { Injectable } from '@angular/core'
import { BehaviorSubject } from 'rxjs/BehaviorSubject'
import { Observable } from 'rxjs/Observable'
import 'rxjs/add/operator/map'
import 'rxjs/add/operator/concatAll'
import 'rxjs/add/operator/share'
import { List } from 'immutable'
import { ISensor } from './sensor.interface'
import { AuthService } from './auth.service'
import * as _orderBy from 'lodash.orderby'
import { Sigv4Http } from './sigv4.service'
import { Config } from 'ionic-angular'

let sensorStoreFactory = (sigv4: Sigv4Http, auth: AuthService, config: Config) => { return new SensorStore(sigv4, auth, config) }

export let SensorStoreProvider = {
  provide: SensorStore,
  useFactory: sensorStoreFactory,
  deps: [Sigv4Http, AuthService]
}


@Injectable()
export class SensorStore {

  private _sensors: BehaviorSubject<List<ISensor>> = new BehaviorSubject(List([]))
  private endpoint:string

  constructor (private sigv4: Sigv4Http, private auth: AuthService, private config: Config) {
    this.endpoint = this.config.get('APIs')['sensorsCRUD']
    
    this.auth.signoutNotification.subscribe(() => this._sensors.next(List([])))
    this.auth.signinNotification.subscribe(() => this.refresh() )
    //this.refresh()
  }

  get sensors () { return Observable.create( fn => this._sensors.subscribe(fn) ) }

  refresh () : Observable<any> {
    if (this.auth.isUserSignedIn()) {
      let observable = this.auth.getCredentials().map(creds => this.sigv4.get(this.endpoint, 'sensors', creds)).concatAll().share()
      observable.subscribe(resp => {
        //console.log(resp)
        let data = resp.json()
        this._sensors.next(List(this.sort(data.sensors)))
      })
      return observable
    } else {
      this._sensors.next(List([]))
      return Observable.from([])
    }
  }

  refreshSelectedSensor (selectedSensorId) : Observable<any> {
    if (this.auth.isUserSignedIn()) {
      let observable = this.auth.getCredentials().map(creds => this.sigv4.get(this.endpoint, 'sensors/object/' + selectedSensorId, creds)).concatAll().share()

      observable.subscribe(resp => {
        if (resp.status === 200) {
          
          //console.log(resp)
                    
        }
      })

      return observable.map(resp => resp.status === 200 ? resp.json().sensor : null)
    }
  }  

  refreshSelectedSharedSensor (selectedStationId, selectedSensorId) : Observable<any> {
    if (this.auth.isUserSignedIn()) {
      let observable = this.auth.getCredentials().map(creds => this.sigv4.get(this.endpoint, 'sensors/shared/' + selectedStationId + '/' + selectedSensorId, creds)).concatAll().share()

      observable.subscribe(resp => {
        if (resp.status === 200) {          
          console.log(resp)                    
        }
      })
      return observable.map(resp => resp.status === 200 ? resp.json().sensor : null)
    }
  }  

  refreshSensorsForStation (selectedStationId) : Observable<any> {
    if (this.auth.isUserSignedIn()) {
      let observable = this.auth.getCredentials().map(creds => this.sigv4.get(this.endpoint, 'sensors/stationId/' + selectedStationId, creds)).concatAll().share()
      observable.subscribe(resp => {
        //console.log(resp)
        let data = resp.json()
        this._sensors.next(List(this.sort(data.sensors)))
      })
      return observable
    } else {
      this._sensors.next(List([]))
      return Observable.from([])
    }
  }    

  addSensor (sensor): Observable<ISensor> {
    let observable = this.auth.getCredentials().map(creds => this.sigv4.post(this.endpoint, 'sensors', sensor, creds)).concatAll().share()

    observable.subscribe(resp => {
      if (resp.status === 200) {
        console.log(resp)
        let sensors = this._sensors.getValue().toArray()
        let sensor = resp.json().sensor
        sensors.push(sensor)
        this._sensors.next(List(this.sort(sensors)))
      }
    })
    return observable.map(resp => resp.status === 200 ? resp.json().sensor : null)
  }

  editSensor (sensor): Observable<ISensor> {
    let observable = this.auth.getCredentials().map(creds => this.sigv4.post(this.endpoint, 'sensors', sensor, creds)).concatAll().share()

    observable.subscribe(resp => {
      if (resp.status === 200) {
        console.log(resp)
        let sensors = this._sensors.getValue().toArray()
        let sensor = resp.json().sensor
        
        this._sensors.next(List(this.sort(sensors)))
      }
    })
    return observable.map(resp => resp.status === 200 ? resp.json().sensor : null)
  }

  deleteSensor (sensorId): Observable<ISensor> {
    let sensors = this._sensors.getValue().toArray()
    let obs = this.auth.getCredentials().map(creds => this.sigv4.del(this.endpoint, `sensors/object/${sensorId}`, creds)).concatAll().share()

    obs.subscribe(resp => {
      if (resp.status === 200) {        
        this._sensors.next(List(<ISensor[]>sensors))
      }
    })
    return obs.map(resp => resp.status === 200 ? resp.json().sensor : null)
  }

  private sort (sensors:ISensor[]): ISensor[] {
    return _orderBy(sensors, ['registeredOn', 'createdOn'], ['asc', 'asc'])
  }
}
