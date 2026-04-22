import { Component,Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { RouterService } from 'src/app/services/router.service';


export interface EntityFilterDialogData {
  entities: Array<{ name: string; selected?: boolean; _id?: string }>;
   observationId?: string;
   entityType?: string;
   isRubricDriven?: boolean;
}
@Component({
  selector: 'app-entity-filter-popup',
  standalone: false,
  templateUrl: './entity-filter-popup.component.html',
  styleUrls:['./entity-filter-popup.component.css']
})

export class EntityFilterPopupComponent {
  selectedEntityName:string; 
  constructor(
    private navigate:RouterService,
    public dialogRef: MatDialogRef<EntityFilterPopupComponent>,
    @Inject(MAT_DIALOG_DATA) public data:EntityFilterDialogData
  ){
    this.selectedEntityName = data?.entities?.[0]?.name ?? ''
  }

  onEntityChange(selectedIndex: number): void {
    this.data.entities.forEach((element,index) => {element.selected = index === selectedIndex});
  }

  applyFilter(){
    let entity = this.data.entities.filter(question => question.selected)
    this.navigate?.navigation(['reports',this.data?.observationId,entity[0]?._id,this.data?.entityType,false,this.data?.isRubricDriven])
    this.dialogRef.close()
  }

  onClose() {
    this.dialogRef.close();
  }

}
