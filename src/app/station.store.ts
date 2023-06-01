import { Injectable } from '@angular/core'
import { BehaviorSubject } from 'rxjs/BehaviorSubject'
import { Observable } from 'rxjs/Observable'
import 'rxjs/add/operator/map'
import 'rxjs/add/operator/concatAll'
import 'rxjs/add/operator/share'
import { List } from 'immutable'
import { IStation } from './station.interface'
import { AuthService } from './auth.service'
import * as _orderBy from 'lodash.orderby'
import { Sigv4Http } from './sigv4.service'
import { Config } from 'ionic-angular'

let stationStoreFactory = (sigv4: Sigv4Http, auth: AuthService, config: Config) => { return new StationStore(sigv4, auth, config) }

export let StationStoreProvider = {
  provide: StationStore,
  useFactory: stationStoreFactory,
  deps: [Sigv4Http, AuthService]
}

@Injectable()
export class StationStore {

  private _stations: BehaviorSubject<List<IStation>> = new BehaviorSubject(List([]))
  private endpoint:string

  constructor (private sigv4: Sigv4Http, private auth: AuthService, private config: Config) {
    this.endpoint = this.config.get('APIs')['stationsCRUD']
    
    this.auth.signoutNotification.subscribe(() => this._stations.next(List([])))
    this.auth.signinNotification.subscribe(() => this.refresh() )
    this.refresh()
  }

  get stations () { return Observable.create( fn => this._stations.subscribe(fn) ) }

  refresh () : Observable<any> {
    if (this.auth.isUserSignedIn()) {
      let observable = this.auth.getCredentials().map(creds => this.sigv4.get(this.endpoint, 'stations', creds)).concatAll().share()
      observable.subscribe(resp => {
        //console.log(resp)
        let data = resp.json()
        this._stations.next(List(this.sort(data.stations)))
      })
      return observable
    } else {
      this._stations.next(List([]))
      return Observable.from([])
    }
  }

  getAllStations () : Observable<any> {
    if (this.auth.isUserSignedIn()) {
      let observable = this.auth.getCredentials().map(creds => this.sigv4.get(this.endpoint, 'stations', creds)).concatAll().share()

      observable.subscribe(resp => {
        if (resp.status === 200) {
          
          console.log(resp)
                    
        }
      })

      return observable.map(resp => resp.status === 200 ? resp.json().stations : null)
    }
  }  

  refreshSelectedStation (selectedStationId) : Observable<any> {
    if (this.auth.isUserSignedIn()) {
      let observable = this.auth.getCredentials().map(creds => this.sigv4.get(this.endpoint, 'stations/object/' + selectedStationId, creds)).concatAll().share()

      observable.subscribe(resp => {
        if (resp.status === 200) {
          
          console.log(resp)
                    
        }
      })

      return observable.map(resp => resp.status === 200 ? resp.json().station : null)
    }
  }  

  addStation (station): Observable<IStation> {
    let observable = this.auth.getCredentials().map(creds => this.sigv4.post(this.endpoint, 'stations', station, creds)).concatAll().share()

    observable.subscribe(resp => {
      if (resp.status === 200) {
        console.log(resp)
        let stations = this._stations.getValue().toArray()
        let station = resp.json().station
        stations.push(station)
        this._stations.next(List(this.sort(stations)))
      }
    })
    return observable.map(resp => resp.status === 200 ? resp.json().station : null)
  }

  editStation (station): Observable<IStation> {
    let observable = this.auth.getCredentials().map(creds => this.sigv4.post(this.endpoint, 'stations', station, creds)).concatAll().share()

    observable.subscribe(resp => {
      if (resp.status === 200) {
        console.log(resp)
        let stations = this._stations.getValue().toArray()
        let station = resp.json().station
        stations.push(station)
        this._stations.next(List(this.sort(stations)))
      }
    })
    return observable.map(resp => resp.status === 200 ? resp.json().station : null)
  }  

  deleteStation (stationId): Observable<IStation> {
    let stations = this._stations.getValue().toArray()
    let obs = this.auth.getCredentials().map(creds => this.sigv4.del(this.endpoint, `stations/object/${stationId}`, creds)).concatAll().share()

    obs.subscribe(resp => {
      if (resp.status === 200) {
        this._stations.next(List(<IStation[]>stations))
      }
    })
    return obs.map(resp => resp.status === 200 ? resp.json().station : null)
  }

  private sort (stations:IStation[]): IStation[] {
    return _orderBy(stations, ['registeredOn', 'createdOn'], ['asc', 'asc'])
  }
}
