import { Component,  OnInit, TemplateRef, ViewChild, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../services/api.service';
import { ToastService } from '../services/toast.service';
import * as urlConfig from '../constants/url-config.json';
import { MatDialog } from '@angular/material/dialog';
import { UrlParamsService } from '../services/urlParams.service';
import { offlineSaveObservation } from '../services/offlineSaveObservation.service';
import { DownloadService } from '../services/download.service';
import { TranslateService } from '@ngx-translate/core';
import { DbService } from '../services/db.service';
import { GenericPopupComponent } from '../shared/generic-popup/generic-popup.component';
import { DownloadDataPayloadCreationService } from '../services/download-data-payload-creation.service';
@Component({
  selector: 'app-observation-domain',
  standalone: false,
  templateUrl: './observation-domain.component.html',
  styleUrl: './observation-domain.component.css'
})
export class ObservationDomainComponent implements OnInit {
  entityId = signal<any>('');
  observations = signal<any[]>([]);
  evidences = signal<any[]>([]);
  expandedIndex = signal<number | null>(null);
  remark = signal('');
  observationId = signal<any>('');
  id = signal<any>('');
  entities = signal<any[]>([]);
  loaded = signal(false);
  submissionNumber = signal<any>(null);
  submissionId = signal<any>('');
  stateData = signal<any>(null);
  observationDownloaded = signal(false);
  isQuestionerDataInIndexDb = signal<any>(null);
  isDataInDownloadsIndexDb = signal<any[]>([]);
  observationDetails = signal<any>(null);

  @ViewChild('notApplicableModel') notApplicableModel: TemplateRef<any>;
  private initTimeoutId: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private apiService: ApiService, 
    private toaster: ToastService, 
    private router: Router,
    private dialog: MatDialog, 
    private urlParamsService:UrlParamsService,
    private route: ActivatedRoute,
    private offlineData:offlineSaveObservation,
    private downloadService: DownloadService,
    private translate:TranslateService,
    private db: DbService,
    private downloadDataPayloadCreationService:DownloadDataPayloadCreationService
     
  ) {
    const passedData = this.router.getCurrentNavigation()?.extras.state;
    this.observationDetails.set(passedData);
  }

  async ngOnInit() {
   setTimeout(async () => {
    window.addEventListener('message', this.handleMessage);
    this.stateData.set(history.state?.data)
    if(this.stateData()) {
      this.mapDataToVariables(this.stateData());
    }else{
      this.urlParamsService.parseRouteParams(this.route);
    this.observationId.set(this.urlParamsService?.observationId);
    this.entityId.set(this.urlParamsService?.entityId);
    this.id.set(this.urlParamsService?.solutionId);
    this.submissionId.set(this.urlParamsService?.solutionId);

    this.isQuestionerDataInIndexDb.set( await this.offlineData.checkAndMapIndexDbDataToVariables(this.submissionId()));

      this.isDataInDownloadsIndexDb.set((await this.downloadService.checkAndFetchDownloadsData(this.observationId(),"observation")) || []);
      
      if (this.isQuestionerDataInIndexDb()?.data) {
        this.mapDataToVariables(this.isQuestionerDataInIndexDb()?.data)
          
      }

        const downloads = this.isDataInDownloadsIndexDb();
        if (Array.isArray(downloads) && downloads.length > 0) {
        const existingIndex = downloads.findIndex(
          (item: any) => 
            item.metaData.submissionId === this.submissionId() &&
          item.metaData.entityId === this.entityId()
        );
        this.observationDownloaded.set(existingIndex !== -1);
        } else {
        this.observationDownloaded.set(false);
      }
    }
   }, 500);
  }


  mapDataToVariables(observationData) {
    const mappedEntities = observationData?.assessment?.evidences || [];
    this.entities.set(mappedEntities);
    this.evidences.set(mappedEntities.map((element: any) => ({ ...element, show: false })));
    this.loaded.set(true);
  }

  toggleExpand(entity:any){
    this.evidences.update((items) =>
      items.map((element: any) => ({
        ...element,
        show: element.code === entity.code ? !element.show : false
      }))
    );
  }

  getObservationsByStatus(statuses: ('All' | 'draft' | 'completed' | 'started')[]) {
    const observations = this.observations();
    if (!observations.length) {
      return [];
    }
    return statuses.includes('All')
      ? observations
      : observations.filter((obs: any) => statuses.includes(obs.status));
  }

  toggleAccordion(index: number) {
    this.expandedIndex.set(this.expandedIndex() === index ? null : index);
  }

  navigateToDetails(data,sectionIndex,entityIndex,notApplicable) {
    if(notApplicable){
      return;
    }
    this.stateData() ? this.statenavigation(entityIndex) :
      this.router.navigate(['questionnaire'], {
        queryParams: { 
          observationId:this.observationId(),
          entityId:this.entityId(),
          submissionNumber:this.submissionNumber(),
          evidenceCode:data?.code, 
          index:entityIndex, 
          submissionId: this.submissionId(),
          sectionIndex:sectionIndex
        },
        state: { data: {
          isSurvey:true
        }}
      });
  }

  async statenavigation(entityIndex:any){
    // await this.router.navigate(['/listing/observation'],{replaceUrl:true});
    this.router.navigate(['questionnaire'], {
      queryParams:{
        solutionType:this.stateData()?.solutionType,
        sectionIndex:entityIndex
      },
      state:{data:{
        ...this.stateData(),
        isSurvey:false
      }}
    })
  }

  notApplicable(entity,selectedIndex) {
    this.remark.set('');
    const dialogRefEcm = this.dialog.open(GenericPopupComponent,{
      width: '400px',
      data: {
        title:'CONFIRM',
        message: 'ECM_NOT_APPLICABLE',
        yesLabel: 'CONFIRM',
        noLabel: 'CANCEL'
      }
    });
    dialogRefEcm.afterClosed().subscribe(result => {
      if (result === 'yes') {
        const dialogRef = this.dialog.open(this.notApplicableModel);
        dialogRef.afterClosed().subscribe(result => {
          if (result === 'add') {
            const evidence = {
              externalId: entity?.code,
              remarks: this.remark(),
              notApplicable: true
            };
            this.updateEntity(evidence,selectedIndex);
          }
        });
      }
    });
  }

  updateEntity(evidences,code) {
    let payload = {
      evidence:{
        ...evidences
      },
      ...this.apiService.profileData
    }
    this.apiService.post(urlConfig.observation.update + this.id(), payload).subscribe(async (res: any) => {
      if (res.status == 200) {
      let data: any = await this.offlineData.checkAndMapIndexDbDataToVariables( this.submissionId());
      if (data?.data?.assessment?.evidences?.[code]) {
        data.data.assessment.evidences[code].notApplicable = true;
        await this.db.updateDB(data?.data,this.submissionId());
        this.isQuestionerDataInIndexDb.set( await this.offlineData.checkAndMapIndexDbDataToVariables(this.submissionId()));
        if(this.isQuestionerDataInIndexDb()?.data){
          this.mapDataToVariables(this.isQuestionerDataInIndexDb()?.data)
        }
      }
        } else {
          this.toaster.showToast(res.message, 'Close');
        }
      }, (err: any) => {
        this.toaster.showToast(err.error.message, 'Close');
      })

  }
  async downloadObservation() {
    const details = this.observationDetails() || {};
    const submissionId = details?._id ?? this.submissionId()
    let isDataInIndexDb: any = await this.offlineData.checkAndMapIndexDbDataToVariables(submissionId);
  
    if (!isDataInIndexDb?.data) {
      const fetched = await this.offlineData.getFullQuestionerData(
        'observation',
        this.observationId(),
        this.entityId(),
        submissionId,
        details?.submissionNumber,
        ""
      );
  
      // normalize to same structure
      isDataInIndexDb =
        fetched?.data ??
        (await this.offlineData.checkAndMapIndexDbDataToVariables(submissionId))?.data;
    } else {
      isDataInIndexDb = isDataInIndexDb.data;
    }
  
    const subTitle =
      isDataInIndexDb?.assessment?.description ?? details?.description ??"";
    const newItem = this.downloadDataPayloadCreationService.buildObservationItem(
      details,
      this.observationId(),
      this.entityId(),
      details?.allowMultipleAssessemts,
      submissionId,
      subTitle
    );
  
    await this.downloadService.downloadData("observation", newItem);
    this.observationDownloaded.set(true);
  }
  
  downloadPop() {
      const dialogRef = this.dialog.open(GenericPopupComponent,{
        width: '400px',
      data: {
        message: 'DOWNLOAD_MSG',
      }
      });
      dialogRef.afterClosed().subscribe(result => {
        if (result === 'yes') {
          this.downloadObservation()
        }
      });
    }
    handleMessage = async(event: MessageEvent) => {
      if (event.data?.type === 'START') {
        const stateData = event.data.data;
          if(stateData?.solution?.isRubricDriven){
           window.history.replaceState({}, '','/home');
            // await this.router.navigate(['/listing/observation'],{replaceUrl:true});
            setTimeout(()=>{
              this.router.navigate([
            'entityList',
            stateData?.solution?._id,
            stateData?.solution?.name]);
          },100)
          }
      }
    };
}