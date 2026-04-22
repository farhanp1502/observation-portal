import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import * as urlConfig from '../constants/url-config.json';
import { ApiService } from '../services/api.service';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { SurveyPreviewComponent } from '../shared/survey-preview/survey-preview.component';
import { UtilsService } from '../services/utils.service';
import { ReportsService } from '../services/reports.service';
import { finalize } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReportsFilterModal } from '../shared/reports-filter-modal/reports-filter-modal';

@Component({
  selector: 'app-survey-reports',
  standalone: false,
  templateUrl: './survey-reports.component.html',
  styleUrl: './survey-reports.component.css'
})
export class SurveyReportsComponent implements OnInit {
  readonly reportDetails = signal<any[]>([]);
  readonly isModalOpen = signal(false);
  readonly isFilterModalOpen = signal(false);
  readonly filteredQuestions = signal<any[]>([]);
  readonly allQuestions = signal<any[]>([]);
  readonly surveyName = signal('');
  readonly submissionId = signal<any>('');
  readonly solutionId = signal<any>('');
  readonly pdf = signal(false);
  readonly loaded = signal(false);

  readonly objectKeys = Object.keys;
  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private apiService: ApiService,
    private dialog: MatDialog,
    private router: ActivatedRoute,
    private utils: UtilsService,
    public route: Router,
    private reports: ReportsService
  ) {}

  ngOnInit() {
    this.router.params.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((param) => {
      this.submissionId.set(param['id']);
      this.solutionId.set(param['solutionId']);
      this.loaded.set(false);

      this.apiService
        .post(urlConfig.survey.reports + `${this.submissionId()}`, {})
        .pipe(
          finalize(() => this.loaded.set(true)),
          takeUntilDestroyed(this.destroyRef)
        )
        .subscribe((res: any) => {
          this.surveyName.set(res?.message?.surveyName || '');
          const reportSections: any[] = Array.isArray(res?.message?.report)
            ? res.message.report
            : [];

          const allQuestions = reportSections.map((question: any) => ({
            ...question,
            selected: true
          }));

          this.allQuestions.set(allQuestions);
          this.reportDetails.set(
            this.processSurveyData(allQuestions).map((item: any) => {
              if (item?.evidences?.length) {
                return {
                  ...item,
                  evidences: this.utils.mapEvidences(item.evidences)
                };
              }
              return item;
            })
          );
        });
    });
  }

  surveyReportPdf(type: any) {
    if (!this.reportDetails().length) return;
    const payload: any = {
      filter: { questionId: this.reportDetails().map((element: any) => element.order) }
    };
    this.apiService
      .post(urlConfig.survey.reports + `${this.submissionId()}&pdf=true`, payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(async (res: any) => {
        if (type === 'download') {
          await this.openUrl(res?.message?.pdfLink);
          return;
        }
        await this.reports.shareReport(res?.message?.pdfLink, 'survey');
      });
  }

  processSurveyData(data: any[]): any[] {
    const mapAnswersToLabels = (answers: any[], optionsAvailable: any[]) => {
      return (answers || []).map((answer: any) => {
        if (typeof answer === 'number') {
          return answer;
        }

        if (!answer || (typeof answer === 'string' && answer.trim() === '')) {
          return false;
        }

        if (typeof answer !== 'string') {
          return answer;
        }

        const trimmedAnswer = answer.trim();
        const option = optionsAvailable?.find(
          (opt: { value: any }) => opt.value === trimmedAnswer
        );
        return option ? option.label : trimmedAnswer;
      });
    };

    const processInstanceQuestions = (instance: any) => {
      const processedInstance = { ...instance };
      for (const key in processedInstance) {
        if (key !== 'instanceIdentifier') {
          processedInstance[key].answers = mapAnswersToLabels(
            processedInstance[key].answers,
            processedInstance[key].optionsAvailableForUser
          );
          delete processedInstance[key].optionsAvailableForUser;
        }
      }
      return processedInstance;
    };

    return data.map((question) => {
      if (question.responseType === 'matrix' && question.instanceQuestions) {
        const processedInstanceQuestions =
          question.instanceQuestions.map(processInstanceQuestions);
        return { ...question, instanceQuestions: processedInstanceQuestions };
      } else {
        const processedQuestion = { ...question };
        processedQuestion.answers = mapAnswersToLabels(
          question.answers,
          question.optionsAvailableForUser
        );
        delete processedQuestion.optionsAvailableForUser;
        return processedQuestion;
      }
    });
  }

  openDialog(evidence: any) {
    const dialogRef = this.dialog.open(SurveyPreviewComponent, {
      width: '400px',
      data: {
        objectType: evidence?.type,
        objectUrl: evidence?.url
      }
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        if (result) {
          this.filteredQuestions.set(result);
          this.applyFilter();
        }
      });
  }

  closeDialog() {
    this.isModalOpen.set(false);
  }

  openFilterDialog() {
    const dialogRef = this.dialog.open(ReportsFilterModal, {
      width: '400px',
      data: {
        allQuestions: this.allQuestions(),
        labelKey: 'question',
        title: 'QUESTIONS'
      }
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        if (result) {
          this.filteredQuestions.set(result);
          this.applyFilter();
        }
      });
  }

  closeFilter() {
    this.isFilterModalOpen.set(false);
  }

  updateFilteredQuestions() {
    this.filteredQuestions.set(this.allQuestions().filter((question) => question.selected));
  }

  checkAnswerValue(answer: any): string | number {
    if (typeof answer === 'string') {
      return answer.trim() === '' ? 'NA' : answer;
    }
    return answer;
  }

  applyFilter() {
    this.updateFilteredQuestions();
    const questionsToProcess =
      this.filteredQuestions().length > 0
        ? this.filteredQuestions()
        : this.allQuestions();
    this.reportDetails.set(this.processSurveyData(questionsToProcess).map(item => {
      if (item?.evidences?.length) {
        return {
          ...item,
          evidences: this.utils.mapEvidences(item.evidences)
        };
      }
      return item;
    }))
  }

  openUrl(evidence: any) {
    window.open(evidence, '_blank');
  }

  allEvidenceClick(question: any) {
    const queryParams = {
      submissionId: this.submissionId(),
      questionExternalId: question?.order,
      surveyEvidence: true,
      solutionId: this.solutionId()
    };
    this.route.navigate(['viewAllEvidences'], {
      queryParams: queryParams
    });
  }
}
