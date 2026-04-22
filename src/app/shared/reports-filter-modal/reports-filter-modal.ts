import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { OBSERVATION_REPORTS_TYPES, ReportsQuestion } from 'src/app/constants/actionContants';
import { ToastService } from 'src/app/services/toast.service';

@Component({
  selector: 'app-reports-filter-modal',
  standalone: false,
  templateUrl: './reports-filter-modal.html',
  styleUrl: './reports-filter-modal.css',
})
export class ReportsFilterModal {

  allQuestions: any[] = [];
  labelKey: string = OBSERVATION_REPORTS_TYPES.QUESTION_LABEL;
  title: string = 'FILTER';

  constructor(
    public dialogRef: MatDialogRef<ReportsFilterModal>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private toaster: ToastService
  ) {
    this.allQuestions = data.allQuestions || [];
    this.labelKey = data.labelKey || OBSERVATION_REPORTS_TYPES.QUESTION_LABEL;
    this.title = data.title || 'FILTER';
  }

  applyFilter() {
    const selected = this.allQuestions.filter(q => q.selected);

    if (selected.length === 0) {
      this.toaster.showToast('SELECT_ATLEAST_ONE_QUESTION', 'danger');
      return;
    }

    this.dialogRef.close(selected);
  }

  resetFilter() {
    this.allQuestions.forEach(q => q.selected = false);
  }

  close() {
    this.dialogRef.close();
  }

   trackById(index: number, question: ReportsQuestion) {
    return question?.id ?? index;
  }

}