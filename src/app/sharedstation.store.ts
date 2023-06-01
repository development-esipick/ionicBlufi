import { Injectable } from '@angular/core'
import { BehaviorSubject } from 'rxjs/BehaviorSubject'
import { Observable } from 'rxjs/Observable'
import 'rxjs/add/operator/map'
import 'rxjs/add/operator/concatAll'
import 'rxjs/add/operator/share'
import { List } from 'immutable'
import { ISharedStation } from './sharedstation.interface'
import { AuthService } from './auth.service'
import * as _orderBy from 'lodash.orderby'
import { Sigv4Http } from './sigv4.service'
import { Config } from 'ionic-angular'

let sharedStationStoreFactory = (sigv4: Sigv4Http, auth: AuthService, config: Config) => { return new SharedStationStore(sigv4, auth, config) }

export let SharedStationStoreProvider = {
  provide: SharedStationStore,
  useFactory: sharedStationStoreFactory,
  deps: [Sigv4Http, AuthService]
}

@Injectable()
export class SharedStationStore {

  private _sharedstations: BehaviorSubject<List<ISharedStation>> = new BehaviorSubject(List([]))
  private endpoint:string

  constructor (private sigv4: Sigv4Http, private auth: AuthService, private config: Config) {
    this.endpoint = this.config.get('APIs')['sharedstationsCRUD']
    
    this.auth.signoutNotification.subscribe(() => this._sharedstations.next(List([])))
    this.auth.signinNotification.subscribe(() => this.refresh() )
    this.refresh()
  }

  get sharedstations () { return Observable.create( fn => this._sharedstations.subscribe(fn) ) }

  refresh () : Observable<any> {
    if (this.auth.isUserSignedIn()) {
      let observable = this.auth.getCredentials().map(creds => this.sigv4.get(this.endpoint, 'sharedstations', creds)).concatAll().share()
      observable.subscribe(resp => {
        //console.log(resp)
        let data = resp.json()
        this._sharedstations.next(List(this.sort(data.sharedstations)))
      })
      return observable
    } else {
      this._sharedstations.next(List([]))
      return Observable.from([])
    }
  }

  refreshSharedInfoForStation (selectedStationId) : Observable<any> {
    if (this.auth.isUserSignedIn()) {
      let observable = this.auth.getCredentials().map(creds => this.sigv4.get(this.endpoint, 'sharedstations/' + selectedStationId, creds)).concatAll().share()
      observable.subscribe(resp => {
        console.log(resp)
        let data = resp.json()
        this._sharedstations.next(List(this.sort(data.sharedstations)))
      })
      return observable
    } else {
      this._sharedstations.next(List([]))
      return Observable.from([])
    }
  }      

  addSharedStation (sharedstation): Observable<ISharedStation> {
    let observable = this.auth.getCredentials().map(creds => this.sigv4.post(this.endpoint, 'sharedstations', sharedstation, creds)).concatAll().share()

    observable.subscribe(resp => {
      if (resp.status === 200) {
        console.log(resp)
        let sharedstations = this._sharedstations.getValue().toArray()
        let sharedstation = resp.json().sharedstation
        sharedstations.push(sharedstation)
        this._sharedstations.next(List(this.sort(sharedstations)))
      }
    })
    return observable.map(resp => resp.status === 200 ? resp.json().sharedstation : null)
  }

  deleteSharedStation (stationId, sharedStationId): Observable<ISharedStation> {
    let sharedstations = this._sharedstations.getValue().toArray()
    let obs = this.auth.getCredentials().map(creds => this.sigv4.del(this.endpoint, `sharedstations/object/${stationId}/${sharedStationId}`, creds)).concatAll().share()

    obs.subscribe(resp => {
      if (resp.status === 200) {        
        console.log(resp);
        this._sharedstations.next(List(<ISharedStation[]>sharedstations))
      }
    })
    return obs.map(resp => resp.status === 200 ? resp.json().sharedstation : null)
  }

  private sort (sharedstations:ISharedStation[]): ISharedStation[] {
    return _orderBy(sharedstations, ['stationId', 'createdOn'], ['asc', 'asc'])
  }
}
