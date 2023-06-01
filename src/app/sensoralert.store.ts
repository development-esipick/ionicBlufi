import { Injectable } from '@angular/core'
import { BehaviorSubject } from 'rxjs/BehaviorSubject'
import { Observable } from 'rxjs/Observable'
import 'rxjs/add/operator/map'
import 'rxjs/add/operator/concatAll'
import 'rxjs/add/operator/share'
import { List } from 'immutable'
import { ISensorAlert } from './sensoralert.interface'
import { AuthService } from './auth.service'
import * as _orderBy from 'lodash.orderby'
import { Sigv4Http } from './sigv4.service'
import { Config } from 'ionic-angular'

let sensorAlertStoreFactory = (sigv4: Sigv4Http, auth: AuthService, config: Config) => { return new SensorAlertStore(sigv4, auth, config) }

export let SensorAlertStoreProvider = {
  provide: SensorAlertStore,
  useFactory: sensorAlertStoreFactory,
  deps: [Sigv4Http, AuthService]
}


@Injectable()
export class SensorAlertStore {

  private _sensoralerts: BehaviorSubject<List<ISensorAlert>> = new BehaviorSubject(List([]))
  private endpoint:string

  constructor (private sigv4: Sigv4Http, private auth: AuthService, private config: Config) {
    this.endpoint = this.config.get('APIs')['sensoralertCRUD']
    
    this.auth.signoutNotification.subscribe(() => this._sensoralerts.next(List([])))
    this.auth.signinNotification.subscribe(() => this.refresh() )
    //this.refresh()
  }

  get sensoralerts () { return Observable.create( fn => this._sensoralerts.subscribe(fn) ) }

  refresh () : Observable<any> {
    if (this.auth.isUserSignedIn()) {
      let observable = this.auth.getCredentials().map(creds => this.sigv4.get(this.endpoint, 'sensoralert', creds)).concatAll().share()
      observable.subscribe(resp => {
        console.log(resp)
        let data = resp.json()
        this._sensoralerts.next(List(this.sort(data.sensoralerts)))
      })
      return observable
    } else {
      this._sensoralerts.next(List([]))
      return Observable.from([])
    }
  }

  refreshSelectedSensorAlert (selectedSensorId) : Observable<any> {
    if (this.auth.isUserSignedIn()) {
      let observable = this.auth.getCredentials().map(creds => this.sigv4.get(this.endpoint, 'sensoralert/object/' + selectedSensorId, creds)).concatAll().share()

      observable.subscribe(resp => {
        if (resp.status === 200) {
          
          console.log(resp)
                    
        }
      })

      return observable.map(resp => resp.status === 200 ? resp.json().sensoralert : null)
    }
  }  

  addSensorAlert (sensorAlert): Observable<ISensorAlert> {
    let observable = this.auth.getCredentials().map(creds => this.sigv4.post(this.endpoint, 'sensoralert', sensorAlert, creds)).concatAll().share()

    observable.subscribe(resp => {
      if (resp.status === 200) {
        console.log(resp)
        let sensoralerts = this._sensoralerts.getValue().toArray()
        let sensorAlert = resp.json().sensorAlert
        sensoralerts.push(sensorAlert)
        this._sensoralerts.next(List(this.sort(sensoralerts)))
      }
    })
    return observable.map(resp => resp.status === 200 ? resp.json().sensorAlert : null)
  }

  editSensorAlert (sensorAlert): Observable<ISensorAlert> {
    let observable = this.auth.getCredentials().map(creds => this.sigv4.post(this.endpoint, 'sensoralert', sensorAlert, creds)).concatAll().share()

    observable.subscribe(resp => {
      if (resp.status === 200) {
        console.log(resp)
        let sensoralerts = this._sensoralerts.getValue().toArray()
        let sensorAlert = resp.json().sensorAlert
        
        this._sensoralerts.next(List(this.sort(sensoralerts)))
      }
    })
    return observable.map(resp => resp.status === 200 ? resp.json().data : null)
  }

  deleteSensorAlert (index): Observable<ISensorAlert> {
    let sensoralerts = this._sensoralerts.getValue().toArray()
    let obs = this.auth.getCredentials().map(creds => this.sigv4.del(this.endpoint, `sensoralert/${sensoralerts[index].sensorId}`, creds)).concatAll().share()

    obs.subscribe(resp => {
      if (resp.status === 200) {
        sensoralerts.splice(index, 1)[0]
        this._sensoralerts.next(List(<ISensorAlert[]>sensoralerts))
      }
    })
    return obs.map(resp => resp.status === 200 ? resp.json().sensorAlert : null)
  }

  private sort (sensoralerts:ISensorAlert[]): ISensorAlert[] {
    return _orderBy(sensoralerts, ['createdOn', 'updatedOn'], ['asc', 'asc'])
  }
}
