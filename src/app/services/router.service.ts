import { Injectable } from '@angular/core';
import { Router } from '@angular/router';


@Injectable({
  providedIn: 'root'
})
export class RouterService {

  constructor(public router: Router) { }

  navigation(route,queryParams?:any,replace:boolean = false){
    this.router.navigate(route,{queryParams:queryParams,replaceUrl:replace})
  }
}