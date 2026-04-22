import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http'
import { Observable } from 'rxjs';
import * as urlConfig from '../constants/url-config.json';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  public baseUrl:string=environment.surveyBaseURL;
  public profileData:any=JSON.parse(localStorage.getItem('profileData'));
  public userAuthToken:any=localStorage.getItem('accToken');

  constructor(private http:HttpClient) { }

  get<T>(url: string, params?: HttpParams): Observable<T> {
    return this.http.get<T>(this.baseUrl+url, { params });
  }

  post<T>(url: string, body: any, headers?: HttpHeaders): Observable<T> {
    return this.http.post<T>(this.baseUrl+url, body, { headers });
  }

  put<T>(url: string, body: any, headers?: HttpHeaders): Observable<T> {
    return this.http.put<T>(this.baseUrl+url, body, { headers });
  }

  postWithFullURL<T>(url: string, body: any, headers?: HttpHeaders): Observable<T> {
    return this.http.post<T>(url, body, { headers });
  }

  putWithFullURL<T>(url: string, body: any, headers?: HttpHeaders): Observable<T> {
    return this.http.put<T>(url, body, { headers });
  }
  
  delete<T>(url: string, body: any): Observable<T> {
    return this.http.delete<T>(this.baseUrl + url, {body} );
  }

  async getAccessToken(): Promise<string | null> {

    const options = {
        url: urlConfig['profileListing'].refreshTokenUrl,
        headers: { 'Content-Type': 'application/json' },
        body: { refresh_token: localStorage.getItem('refToken')},
    };
        try {
        const res = await this.http.post<any>(this.baseUrl + options.url, options.body, { headers: options.headers }).toPromise();
        return res.result.access_token;
    } catch (error) {
        console.error('Error retrieving access token:', error);
        return null;
    }
    }
}