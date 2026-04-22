import { Component, DestroyRef } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Inject } from '@angular/core';
import { ToastService } from 'src/app/services/toast.service';
import { ApiService } from 'src/app/services/api.service';
import * as urlConfig from '../../constants/url-config.json';
import { Subject } from 'rxjs';
import { debounceTime, finalize } from 'rxjs/operators';
import { MatSelectionListChange } from '@angular/material/list';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-add-entity-popup',
  standalone: false,
  templateUrl: './add-entity-popup.component.html',
  styleUrls: ['./add-entity-popup.component.css']
})
export class AddEntityPopupComponent {
  selectedEntities: any;
  observationId: any;
  entityToAdd:any;
  filteredEntities: any;
  searchAddEntityValue: string = "";
  addedEntities: string[] = [];
  loaded:boolean=true;
  searchInputChanged: Subject<string> = new Subject<string>();
  constructor(public dialogRef: MatDialogRef<AddEntityPopupComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private toaster: ToastService,
    private apiService: ApiService,
    private destroyRef: DestroyRef,
){
  this.entityToAdd = data.entityToAdd;
  this.observationId=data.observationId;
  this.selectedEntities=data.selectedEntities;
}

  ngOnInit() {
    this.filteredEntities =[];
    this.searchAddEntityValue ="";
    this.getSearchEntities();
    this.searchInputChanged
      .pipe(debounceTime(800),
      takeUntilDestroyed(this.destroyRef)
    )
      .subscribe((searchValue: string) => {
        this.getSearchEntities(searchValue);
      });
  }
 
  getSearchEntities(searchValue:any="") {
    this.loaded = true
    this.searchAddEntityValue = searchValue;
    let parentEntityId = this.selectedEntities?.parentEntityKey
    ? this.apiService.profileData[this.selectedEntities?.parentEntityKey]
    : "";

  let url = urlConfig.observation.searchEntities + this.observationId + `&search=${searchValue}`;

  if (parentEntityId) {
    url += `&parentEntityId=${parentEntityId}`;
  }

  this.apiService.post(url, this.apiService.profileData).pipe(finalize(() => this.loaded = false))
      .subscribe((res: any) => {
        if (res.result) {
          const searchEntities = res?.result?.[0]?.data ?? [];
          this.filteredEntities = [...searchEntities];
        } else {
          this.toaster.showToast(res.message, 'Close');
        }
      }, (err: any) => {
        this.toaster.showToast(err.error.message, 'Close');
      })
  }

  onSelectionChange(event: MatSelectionListChange): void {
    event?.options.forEach(option => {
      const entityId = option.value;
      if (option.selected) {
        if (!this.addedEntities.includes(entityId)) {
          this.addedEntities.push(entityId);
        }
      } else {
        this.addedEntities = this.addedEntities.filter(id => id !== entityId);
      }
    });
  }

  isEntityInFilteredEntitiesOne(entity: any): boolean {
    return this.selectedEntities?.entities?.some(
      (filteredEntity: any) => filteredEntity._id === entity._id
    ) ?? false;
  }

  isEntitySelected(entity: any): boolean {
    return (
      this.selectedEntities?.entities?.some(
        (filteredEntity: any) => filteredEntity._id === entity._id
      ) ||
      this.addedEntities.includes(entity._id)
    );
  }

}
