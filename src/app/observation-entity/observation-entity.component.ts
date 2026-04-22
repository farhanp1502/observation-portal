import { Component, signal } from '@angular/core';
import { ApiService } from '../services/api.service';
import * as urlConfig from '../constants/url-config.json';
import { ToastService } from '../services/toast.service';
import { ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { catchError, finalize } from 'rxjs';
import { UrlParamsService } from '../services/urlParams.service';
import { GenericPopupComponent } from '../shared/generic-popup/generic-popup.component';
import { AddEntityPopupComponent } from '../shared/add-entity-popup/add-entity-popup.component';
import { UtilsService } from '../services/utils.service';
import { RouterService } from '../services/router.service';
@Component({
  selector: 'app-observation-entity',
  standalone: false,
  templateUrl: './observation-entity.component.html',
  styleUrl: './observation-entity.component.css'
})
export class ObservationEntityComponent  {
  selectedEntities = signal<any>(null);
  solutionId = signal<string>('');
  entityToAdd = signal<string>('entity');
  filteredEntitiesOne = signal<any[]>([]);
  observationId = signal<string>('');
  loaded = signal(false);
  headerConfig = signal<any>(null);


  constructor(
    private apiService: ApiService,
    private toaster: ToastService,
    private dialog: MatDialog,
    private urlParamsService:UrlParamsService,
    private route: ActivatedRoute,
    private utils:UtilsService,
    private navigate:RouterService
  ) {}

  async ngOnInit() {
    this.urlParamsService.parseRouteParams(this.route);
    this.solutionId.set(this.urlParamsService?.solutionId || '');
    this.entityToAdd.set(this.urlParamsService?.entityType || 'entity');
    this.setHeaderConfig();
    try {
      if (!this.apiService?.profileData) {
        await this.utils.getProfileDetails();
      }
    } catch (err: any) {
      this.toaster.showToast(
        err?.error?.message ?? 'PROFILE FETCH FAILED',
        'danger'
      );
      this.loaded.set(true);
      return;
    }
    this.getEntities();
  }

   getEntities() {
    this.selectedEntities.set(null);
    this.observationId.set('');
    this.apiService.post(urlConfig.observation.getSelectedEntities + this.solutionId(), this.apiService.profileData)
      .pipe(
        finalize(() => this.loaded.set(true)),
        catchError((err: any) => {
          this.toaster.showToast(err.error.message,'danger');
          throw Error(err);
        })
      )
      .subscribe((res: any) => {
        if (res.status == 200) {
          this.observationId.set(res?.result?._id || '');
          this.selectedEntities.set(res?.result);
          this.filteredEntitiesOne.set([...(res?.result?.entities ?? [])]);
          this.entityToAdd.set(res?.result?.entityType || 'entity');
          this.setHeaderConfig();
        } else {
          this.toaster.showToast(res.message, 'danger');
        }
      })
  }

  openAllEntityList() {
    const dialogRef = this.dialog.open(AddEntityPopupComponent, {
          width: '80%',
          height: 'auto',
          data: {
            entityToAdd: this.entityToAdd(),
            observationId:this.observationId(),
            selectedEntities:this.selectedEntities()
          }
        });

        dialogRef.afterClosed().subscribe((result) => {
          if (result) {
            this.updateEntities(result);
          }
        });
  }

  updateEntities(selectedEntities) {
    this.apiService.post(urlConfig.observation.updateEntities + this.observationId(), { data: selectedEntities })
      .subscribe((res: any) => {
        if (res.status == 200) {
          this.getEntities();
        } else {
          this.toaster.showToast(res.message, 'Close');
        }
      }, (err: any) => {
        this.toaster.showToast(err.error.message, 'Close');
      })
  }

  handleEntitySearchInput(value?: any) {
    const searchTerm = (value || '').toLowerCase();
    this.headerConfig.update((config: any) => ({
      ...config,
      searchTerm
    }));
    this.filteredEntitiesOne.set(
      (this.selectedEntities()?.entities || []).filter((item: any) =>
        item?.name?.toLowerCase().includes(searchTerm)
      )
    );
  }
  navigateToDetails(data) {
    this.navigate.navigation(['details',this.observationId(), data?._id, this.selectedEntities()?.allowMultipleAssessemts],{name:data?.name,submissionId: data?.submissionId})
  }


  deleteEntity(id) {
    const dialogRef = this.dialog.open(GenericPopupComponent,{
      width: '400px',
      data: {
        title: 'CONFIRM_DELETION',
        message: 'CONFIRM_DELETE',
        entityType: this.selectedEntities()?.entityType
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'yes') {
        this.apiService.delete(urlConfig.observation.updateEntities + this.observationId(), { data: [id] })

          .subscribe((res: any) => {
            if (res.status == 200) {
              this.toaster.showToast(res.message, 'success', 5000);
              this.getEntities();
            } else {
              this.toaster.showToast(res.message, 'Close');
            }
          }, (err: any) => {
            this.toaster.showToast(err.error.message, 'Close');
          })
      }
    });
  }

  setHeaderConfig(){
    this.headerConfig.set({
      title:decodeURIComponent(decodeURIComponent(this.urlParamsService?.name || '')),
      description:'SELECT_ENTITY_FROM_LIST',
      placeholder:'SEARCH_ENTITY_PLACEHOLDER',
      searchTerm:'',
      showSearch:false,
      solutionType:this.entityToAdd()
    })
  }

}
