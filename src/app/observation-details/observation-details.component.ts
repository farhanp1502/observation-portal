import { Component, OnInit, TemplateRef, ViewChild, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../services/api.service';
import { ToastService } from '../services/toast.service';
import * as urlConfig from '../constants/url-config.json';
import { MatDialog } from '@angular/material/dialog';
import { catchError, finalize } from 'rxjs';
import { MatTabChangeEvent } from '@angular/material/tabs';
import { UrlParamsService } from '../services/urlParams.service';
import { QueryParamsService } from '../services/queryParams.service';
import { offlineSaveObservation } from '../services/offlineSaveObservation.service';
import { DownloadService } from '../services/download.service';
import { DbDownloadService } from '../services/dbDownload.service';
import { NetworkServiceService } from 'network-service';
import {TranslateService} from '@ngx-translate/core';
import { dialogConfirmationMap } from '../constants/actionContants';
import { GenericPopupComponent } from '../shared/generic-popup/generic-popup.component';
import { DownloadDataPayloadCreationService } from '../services/download-data-payload-creation.service';

@Component({
  selector: 'app-observation-details',
  standalone: false,
  templateUrl: './observation-details.component.html',
  styleUrl: './observation-details.component.css'
})
export class ObservationDetailsComponent implements OnInit {
  entityId = signal<any>('');
  observationId = signal<any>('');
  observations = signal<any[]>([]);
  observationName = signal<any>('');
  observationInit = signal<boolean>(false);
  selectedTabIndex = signal(0);
  allowMultipleAssessemts = signal<any>('');
  loaded = signal(false);
  isPendingTabSelected = signal<boolean>(true);
  filteredObservations = signal<any[]>([]);
  isRubricDriven = signal<any>(null);
  isQuestionerDataInIndexDb = signal<any>(null);
  allObservationDownloadedDataInIndexDb = signal<any>(null);
  dbKeys = signal<any[]>([]);
  submissionIdSet = signal<Set<string>>(new Set<string>());
  confirmModel = signal<any>(null);

  @ViewChild('updateDialogModel') updateDialogModel: TemplateRef<any>;

  constructor(
    private apiService: ApiService, 
    private toaster: ToastService, 
    private router: Router,
    private dialog: MatDialog,
    private urlParamsService:UrlParamsService,
    private route: ActivatedRoute,
    private queryParamsService: QueryParamsService,
    private offlineData:offlineSaveObservation,
    private downloadService: DownloadService,
    private dbDownloadService: DbDownloadService,
    private network: NetworkServiceService,
    private translate: TranslateService,
    private downloadDataPayloadCreationService:DownloadDataPayloadCreationService
    
  ) {
  }

  ngOnInit(): void {
    this.queryParamsService.parseQueryParams()
    this.urlParamsService.parseRouteParams(this.route)
    this.entityId.set(this.urlParamsService?.entityId)
    this.observationId.set(this.urlParamsService?.observationId);
    this.allowMultipleAssessemts.set(this.urlParamsService?.allowMultipleAssessemts);
    this.observationInit.set(true);
    this.network.isOnline$.subscribe(status => {
      if (status == true) {
        this.loaded.set(false);
        this.getObservationByEntityId();
        this.fetchDownloadedData(false);
      } else {
        this.loaded.set(true);
        this.setLanguage();
        this.fetchDownloadedData(true);
      }});
}

dialogMessage(data: any, entity?: any) {
  this.confirmModel.set(dialogConfirmationMap[data]);
  const actionsMap: Record<string, () => void> = {
    observeAgain: () => this.observeAgain(),
    downloadPop: () => this.downloadObservation(entity)
  };

  const dialogRef = this.dialog.open(GenericPopupComponent,{
    width: '400px',
      data: {
        title: this.confirmModel()?.title,
        message: this.confirmModel()?.message
      }
  });
    dialogRef.afterClosed().subscribe((result) => {
      if (result === 'yes' && actionsMap[data]) {
        actionsMap[data]();
      }
    });
}
close(){
  this.dialog.closeAll()
}

getObservationsByStatus(statuses: ('draft' | 'inprogress' | 'completed' | 'started')[]): void {
    const observations = this.observations();
    if (!observations?.length) {
    this.filteredObservations.set([]);
    return;
  }

  if (statuses.includes('completed')) {
    this.filteredObservations.set(observations.filter((obs) => obs?.status === 'completed'));
  } else {
    this.filteredObservations.set(observations.filter((obs) => statuses.includes(obs?.status)));
  }
}


 async getObservationByEntityId() {
    this.apiService.post(urlConfig.observation.observationSubmissions + this.observationId() + `?entityId=${this.entityId()}`, this.apiService.profileData)
    .pipe(
      finalize(() => this.loaded.set(true)),
      catchError((err: any) => {
        this.toaster.showToast(err?.error?.message, 'Close');
        throw Error(err);
      })
    )
      .subscribe((res: any) => {
        if (res?.result) {
          if (this.observationInit() && !res?.result?.length) {
            this.observationInit.set(false);
            this.observeAgain();
          } else {
            this.observationInit.set(false);
            this.observations.set(res?.result);
            this.isRubricDriven.set(res?.result[0]?.isRubricDriven);
            this.getObservationsByStatus(['draft', 'started', 'inprogress']);
          }
        } else {
          this.toaster.showToast(res?.message, 'danger');
        }
      })
  }

  async navigateToDetails(data) {
    let isDataInIndexDb = await this.offlineData.checkAndMapIndexDbDataToVariables(data?._id);

    if (!isDataInIndexDb?.data) {
      await this.offlineData.getFullQuestionerData("observation",this.observationId(),this.entityId(),data?._id,data?.submissionNumber,"");
    }


    if (data?.isRubricDriven) {
      this.router.navigate([
        'domain',
        data?.observationId,
        data.entityId,
        data?._id
      ],
      {
        state: {
          ...data,
          allowMultipleAssessemts: this.allowMultipleAssessemts()
        }
      });
    } else {
      const evidenceCode = data?.evidenceCode ?? data?.evidencesStatus?.[0]?.code;
      this.router.navigate(['questionnaire'], {
        queryParams: {observationId: data?.observationId, entityId: data?.entityId, submissionNumber: data?.submissionNumber, evidenceCode, index: 0,submissionId:data?._id
        },
        state: { data: {
          isSurvey:true
        }}
      });
    }
  }

  editEntity(entity: any, id: any) {
    this.observationName.set(entity);
    const dialogRef = this.dialog.open(this.updateDialogModel);

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'update') {
        this.updateEntity(id);
      }
    });
  }


  deleteEntity(id: any) {

    const dialogRef = this.dialog.open(GenericPopupComponent,{
      width: '400px',
      data: {
        title: 'CONFIRM_DELETION',
        message: 'DELETE_OBSERVATION_CONFIRMATION',
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'yes') {
        this.apiService.delete(urlConfig.observation.update + id, { data: [] })
          .subscribe((res: any) => {
            if (res.status == 200) {
              this.getObservationByEntityId();
            } else {
              this.toaster.showToast(res.message, 'Close');
            }
          }, (err: any) => {
            this.toaster.showToast(err.error.message, 'Close');
          })
      }
    });
  }

  updateEntity(id: any) {
    const payload = {
      title: this.observationName()
    }
    this.apiService.post(urlConfig.observation.update + id, payload)
      .subscribe((res: any) => {
        if (res.status == 200) {
          this.getObservationByEntityId();
        } else {
          this.toaster.showToast(res.message, 'Close');
        }
      }, (err: any) => {
        this.toaster.showToast(err.error.message, 'Close');
      })
  }

  observeAgain() {
    this.apiService.post(urlConfig.observation.create + this.observationId() + `?entityId=${this.entityId()}`, {})
      .subscribe((res: any) => {
        if (res.result) {
          this.getObservationByEntityId();
        } else {
          this.toaster.showToast(res.message, 'danger');
        }
      })
  }

  viewReport(entity?) {
    this.router.navigate([
      'reports',
      this.observationId(),
      this.entityId(),
      entity ? entity?.entityType : this.observations()?.[0]?.entityType,
      entity ? false : true,
      this.isRubricDriven()
    ],{
      queryParams:{
        'submissionId': entity?._id,
      }
    });
  }

  toggleTabs(event: MatTabChangeEvent): void {
    const selectedTabLabel = event.tab.textLabel;
    if (selectedTabLabel === 'In progress') {
      this.isPendingTabSelected.set(true);
      this.getObservationsByStatus(['draft', 'started', 'inprogress']);
    } else if (selectedTabLabel === 'Completed') {
      this.isPendingTabSelected.set(false);
      this.getObservationsByStatus(['completed']);
    }
}
async downloadObservation(observationDetail: any) {
  try {
    const observationDetails = {
      ...observationDetail,
      allowMultipleAssessemts: this.allowMultipleAssessemts()
    };

    let observationData: any = await this.offlineData.checkAndMapIndexDbDataToVariables(
      observationDetails?._id
    );

    observationData = observationData?.data
      ? observationData.data
      : await this.offlineData.getFullQuestionerData(
          "observation",
          this.observationId(),
          this.entityId(),
          observationDetails?._id,
          observationDetails?.submissionNumber,
          ""
        );

    const subTitle =
      observationData?.assessment?.description ??
      observationDetail?.program?.name ??
      "";

    const newItem = this.downloadDataPayloadCreationService.buildObservationItem(
      observationDetail,
      this.observationId(),
      this.entityId(),
      this.allowMultipleAssessemts(),
      observationDetail?._id,
      subTitle
    );

    await this.downloadService.downloadData('observation', newItem);
    this.fetchDownloadedData(false);
  } catch (err) {
    this.toaster.showToast(
      this.translate.instant("DOWNLOAD_FAILED"),
      "Close"
    );
  }
}


updateDownloadedSubmissions() {
  this.submissionIdSet.set(
 new Set(this.dbKeys()?.map((item: any) => item.metaData?.submissionId))
  );
}

async fetchDownloadedData(mapData) {
  this.allObservationDownloadedDataInIndexDb.set(await this.dbDownloadService.getAllDownloadsDatas("observation"));
  this.isQuestionerDataInIndexDb.set(this.allObservationDownloadedDataInIndexDb()?.find(
    item => item.key === this.observationId())
  );
  this.dbKeys.set(this.isQuestionerDataInIndexDb()?.data || []);
  this.updateDownloadedSubmissions();
  if (mapData) {
      const mapped = (this.isQuestionerDataInIndexDb()?.data || []).map((item: any) => ({
      title: item.metaData.observationName,
      createdAt: item.metaData.observationCreatedDate,
      isRubricDriven: item.metaData.isRubric,
      _id: item.metaData.submissionId,
      status: item.metaData.status,
      observationId: item.metaData.observationId,
      entityId: item.metaData.entityId,
      submissionNumber: item.metaData.submissionNumber,
      evidenceCode: item.metaData.evidenceCode
    }));
    this.observations.set(mapped);
    this.observationInit.set(false);
    this.isRubricDriven.set(this.isQuestionerDataInIndexDb()?.data?.[0]?.isRubric);
    this.getObservationsByStatus(['draft', 'started', 'inprogress']);
  }
}
setLanguage() {
  this.translate.setDefaultLang('en');
  this.translate.use('en');
}
}
