import { Injectable } from '@angular/core';
import { DbService } from './db.service';
import { ApiService } from './api.service';
import { ToastService } from './toast.service';
import * as urlConfig from '../constants/url-config.json';
import { catchError, finalize } from 'rxjs';
@Injectable({
  providedIn: 'root'
})
export class offlineSaveObservation {
  constructor(
    private apiService: ApiService,
    private toaster: ToastService,
    private db: DbService
  ) {
  }
  getFullQuestionerData(type: 'observation' | 'survey', observationId: string, entityId: string, submissionId: string,submissionNumber: string | number, solutionId: string): Promise<any> {
    return new Promise((resolve, reject) => {
      let apiUrl = '';

    if (type === 'observation') {
      apiUrl = urlConfig.observation.details + `${observationId}?entityId=${entityId}&submissionNumber=${submissionNumber}`
    } else if (type === 'survey') {
      apiUrl = urlConfig.survey.details + `${solutionId}`
    }

      this.apiService.post(apiUrl, this.apiService.profileData)
        .pipe(
          catchError((err: any) => {
            this.toaster.showToast(err?.error?.message, 'Close');
            reject(err);
            return [];
          })
        )
        .subscribe(async (res: any) => {
          if (res?.result) {
            let responseData = res.result;

            await this.setDataInIndexDb(responseData, responseData?.assessment?.submissionId || submissionId);
            resolve(res.result);
          } else {
            this.toaster.showToast(res?.message, 'danger');
            reject(res?.message);
          }
        });
    });
  }
  async setDataInIndexDb(observationData, submissionId) {
    const data = {
      key: submissionId,
      data: observationData
    }
    try {
      await this.db.addData(data);
    } catch (error) {
      console.error("Failed to store data in IndexedDB", error);
    }
  }

  async checkAndMapIndexDbDataToVariables(submissionId) {
    let indexdbData = await this.db.getData(submissionId);
    let currentObservation = {
      data: indexdbData?.data
    };
    return currentObservation;
  }
}