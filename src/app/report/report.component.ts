import { booleanAttribute, ChangeDetectorRef, Component,DestroyRef, Input, OnInit, inject,signal} from '@angular/core';
import { ApiService } from '../services/api.service';
import * as urlConfig from '../constants/url-config.json';
import { ToastService } from '../services/toast.service';
import { catchError, finalize } from 'rxjs';
import { ApiConfiguration } from '../interfaces/questionnaire.type';
import { ActivatedRoute, Router } from '@angular/router';
import {
  Chart,
  PieController,
  BarController,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
} from 'chart.js';
import { UrlParamsService } from '../services/urlParams.service';
import { QueryParamsService } from '../services/queryParams.service';
import { SurveyPreviewComponent } from '../shared/survey-preview/survey-preview.component';
import { MatDialog } from '@angular/material/dialog';
import { UtilsService } from '../services/utils.service';
import { ReportsService } from '../services/reports.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReportsFilterModal } from '../shared/reports-filter-modal/reports-filter-modal';
import { OBSERVATION_REPORTS_TYPES} from '../constants/actionContants';
Chart.register(PieController, BarController, ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

@Component({
  selector: 'app-report',
  standalone: false,
  templateUrl: './report.component.html',
  styleUrls: ['./report.component.css','../listing/listing.component.css']
})
export class ReportComponent implements OnInit {
  reportDetails = signal<any[]>([]);
  objectURL = signal<any>(null);
  isModalOpen = signal(false);
  filteredQuestions = signal<any[]>([]);
  allQuestions = signal<any[]>([]);
  observationDetails = signal<any>(null);
  submissionId = signal<any>(null);
  entityType = signal<any>(null);
  resultData = signal<any>(null);
  totalSubmissions = signal<any[]>([]);
  observationId = signal<any>(null);
  observationType = signal<any>(OBSERVATION_REPORTS_TYPES?.QUESTIONS);
  entityId = signal<any>(null);
  loaded = signal(false);
  filterData = signal<any>(null);
  isMultiple = signal<any>(null);
  scores = signal(false);
  domainView = signal<any>(null);
  initialLoad = signal(true);
  isData = signal(false);

  objectKeys = Object.keys;
  private readonly destroyRef = inject(DestroyRef);

  @Input() apiConfig: ApiConfiguration;
  @Input({ transform: booleanAttribute }) angular = false;

  constructor(
    public router: Router,
    public apiService: ApiService,
    public toaster: ToastService,
    private cdr: ChangeDetectorRef,
    private urlParamsService: UrlParamsService,
    private route:ActivatedRoute,
    private queryParamsService: QueryParamsService,
    private dialog: MatDialog,
    private utils:UtilsService,
    private reports:ReportsService,
  ) {}

  ngOnInit() {
    this.queryParamsService.parseQueryParams()
    this.urlParamsService.parseRouteParams(this.route)
    this.observationId.set(this.urlParamsService?.observationId);
    this.submissionId.set(this.queryParamsService?.submissionId);
    this.entityType.set(this.urlParamsService?.entityType);
    this.entityId.set(this.urlParamsService?.entityId);
    this.isMultiple.set(this.urlParamsService?.isMultiple);
    const scoresValue = this.urlParamsService?.scores;
    this.scores.set(scoresValue === 'true');

    this.loadObservationReport(this.submissionId(), false, false);
  }

  loadObservationReport(submissionId: string, criteria: boolean, pdf: boolean) {
    this.resultData.set([]);
    this.observationDetails.set('');
    this.totalSubmissions.set([]);
    this.allQuestions.set([]);
    this.reportDetails.set([]);
    this.isData.set(false);

    let payload = this.createPayload(submissionId, criteria, pdf);

    this.apiService.post(urlConfig.survey.reportUrl, payload)
      .pipe(
        finalize(() =>{
          this.isData.set(true)
          this.loaded.set(true)}),
        catchError((err) => {
          this.toaster.showToast(err?.error?.message, 'danger', 5000)
          throw new Error('Could not fetch the details');
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res: any) => {
        this.resultData.set(res?.result?.result);
        this.observationDetails.set(res?.result);
        const details = this.observationDetails();
        const dropDownFilterData =details?.filters?.find(
          (item: any) => item?.filter?.type === 'dropdown'
        ) ?? null;
        if (!submissionId) {
          this.filterData.set(dropDownFilterData);
        }

        this.totalSubmissions.set(res?.result?.totalSubmissions || []);
        this.observationId.set(res?.result?.observationId);
        let reportSections:any = this.scores() ? [res?.result?.reportSections[0]] : res?.result?.reportSections;
        this.domainView.set(this.scores() ? res?.result?.reportSections[1]?.chart : "");
        const allQuestions = (reportSections || []).map((question:any) => {
          return { ...question, selected: true }
        });
        this.allQuestions.set(allQuestions);
        const processed = this.processSurveyData(allQuestions).map((item: any) => {
          if (item?.evidences?.length) {
            return {
              ...item,
              evidences: this.utils.mapEvidences(item.evidences)
            };
          }
          return item;
        });
        this.reportDetails.set(processed);
        this.cdr.detectChanges();
        this.observationType() === OBSERVATION_REPORTS_TYPES.QUESTIONS ? this.renderCharts(this.reportDetails(), false) : this.renderCharts(this.reportDetails(), true);
        if (this.initialLoad()) {
          this.initialLoad.set(false);
          this.filterData.set(dropDownFilterData);
        }
      });
  }

  createPayload(submissionId: string, criteria: boolean, pdf: boolean): any {
    let filter;
     if(pdf){
      filter = criteria
      ? { criteria: this.filteredQuestions().map((item: any) => item?.criteriaId) }
      : { questionId: this.filteredQuestions().map((item: any) => item?.order) };
     }
    return {
      submissionId,
      observation: true,
      entityType: this.entityType(),
      pdf,
      filter,
      criteriaWise: criteria,
      entityId:this.entityId(),
      observationId:this.observationId(),
      scores:this.scores()
    };
  }

  processSurveyData(data: any): any[] {
    const mapAnswersToLabels = (answers: any[], options: any[]) => {
      if (!Array.isArray(answers)) {
        return [];
      }
      return answers.map((answer: any) => {
        if (typeof answer === 'string') {
          const trimmedAnswer = answer.trim();
          if (trimmedAnswer === '') {
            return 'No response is available';
          }

          const option = options?.find((opt: { value: any }) => opt?.value === trimmedAnswer);
          return option ? option?.label : trimmedAnswer;
        }
        return answer;
      });
    };

    const processQuestion = (question: any) => {
      if (question?.responseType === 'matrix' && question?.answers) {
        const processedInstanceQuestions = question?.answers.map(processInstanceQuestions);
        return { ...question, answers: processedInstanceQuestions };
      } else {
        const processedQuestion = { ...question };
        processedQuestion.answers = this.scores() ? "" :mapAnswersToLabels(question?.answers, question?.options);
        delete processedQuestion?.options;
        processedQuestion.chartData = this.isChartNotEmpty(processedQuestion?.chart)
        return processedQuestion;
      }
    };

    const processInstanceQuestions = (instance: any) => {
      const processedInstance = { ...instance };
      for (const key in processedInstance) {
        if (key !== 'instanceIdentifier') {
          processedInstance[key].answers = mapAnswersToLabels(
            processedInstance[key].answers,
            processedInstance[key].options
          );
          delete processedInstance[key].options;
        }
      }
      return processedInstance;
    };

    if (this.observationType() === 'questions') {
      return data.map(processQuestion);
    } else {
      return data.map((criterias) => {
          return criterias?.questionArray.map(processQuestion);
      });
    }
  }

  renderCharts(reportDetails: any[], isCriteria: boolean = false) {
    const flattenedReportDetails = isCriteria ? reportDetails.flat() : reportDetails;
    const canvases = document.querySelectorAll('.chart-canvas');
  
    canvases.forEach((canvas, index) => {
      if (!(canvas instanceof HTMLCanvasElement)) return;
  
      const question = flattenedReportDetails[index];
      if (!question?.chart?.data) return;
  
      const isHorizontal = question.chart.type === 'horizontalBar';
      const chartType = isHorizontal ? 'bar' : question.chart.type;
  
      const baseOptions = this.getChartOptions(chartType, isHorizontal);
  
      const backendOptions = this.normalizeBackendOptions(question.chart.options, isHorizontal);
      const mergedOptions = this.deepMerge(baseOptions, backendOptions);
  
      const datasets = question.chart.data.datasets.map((ds: any) => ({
        ...ds
      }));

      const existing = Chart.getChart(canvas as HTMLCanvasElement);
if (existing) existing.destroy();
  
      new Chart(canvas, {
        type: chartType,
        data: {
          labels: question.chart.data.labels,
          datasets
        },
        options: mergedOptions
      });
    });
  }

  private deepMerge(target: any, source: any): any {
    if (!source || typeof source !== 'object') return target;
  
    const out = Array.isArray(target) ? [...target] : { ...target };
  
    for (const key of Object.keys(source)) {
      const s = source[key];
      const t = (out as any)[key];
  
      if (Array.isArray(s)) {
        (out as any)[key] = s.slice();
      } else if (s && typeof s === 'object') {
        (out as any)[key] = this.deepMerge(
          t && typeof t === 'object' ? t : {},
          s
        );
      } else {
        (out as any)[key] = s;
      }
    }
  
    return out;
  }
  
  

  private normalizeBackendOptions(backendOptions: any, isHorizontal: boolean) {
    const options: any = backendOptions ? { ...backendOptions } : {};
  
    if (backendOptions?.scales) {
      const { xAxes, yAxes, ...rest } = backendOptions.scales;
      options.scales = { ...rest };
  
      const x = Array.isArray(xAxes) ? xAxes[0] : xAxes;
      const y = Array.isArray(yAxes) ? yAxes[0] : yAxes;
  
      if (x) options.scales.x = x;
      if (y) options.scales.y = y;
    }
  
    if (isHorizontal) {
      options.indexAxis = 'y';
    }
  
    return options;
  }
  
  
  

  private getChartOptions(chartType: string, isHorizontalBar: boolean): any {
    const options: any = {
      indexAxis: 'y',
      maintainAspectRatio: true,
      responsive: true,
      scales: {
        x: { stacked: true },
        y: {
          stacked: true,
          ticks: { autoSkip: false },
          categoryPercentage: 0.6,
          barPercentage: 0.8
        }
      },
      plugins: {
        datalabels: {
          display: true,
        },
        legend: {
          display: true,
        },
        tooltip: {
          enabled: true
        },
      }
    };

    if (chartType === 'bar') {
      options.scales = {
        x: {
          beginAtZero: true,
          ticks: {
            autoSkip: false,
            maxRotation: 0,
            minRotation: 0
          }
        },
        y: {
          beginAtZero: true,
          ticks: {
            autoSkip: false
          }
        }
      };

      if (isHorizontalBar) {
        options.indexAxis = 'y';
      }
    }

    return options;
  }

openDialog(evidence: any) {
    this.dialog.open(SurveyPreviewComponent, {
      width: '400px',
      data: {
        objectType:evidence?.type,
        objectUrl:evidence.previewUrl
      }
    })
  }

  closeDialog() {
    this.isModalOpen.set(false);
  }

  openFilter() {
     const dialogRef = this.dialog.open(ReportsFilterModal, {
          width: '400px',
          data: { 
            allQuestions: this.allQuestions(),
            labelKey: this.observationType() === OBSERVATION_REPORTS_TYPES?.QUESTIONS ? OBSERVATION_REPORTS_TYPES?.QUESTION_LABEL : OBSERVATION_REPORTS_TYPES?.CRITERIA_LABEL,
            title: 'SELECT_QUESTIONS_FILTER'
           }  
        });
      
        dialogRef.afterClosed().subscribe((result) => {
          if (result) {
            this.filteredQuestions.set(result);
           this.applyFilter()
          }
        });
  }

 


  checkAnswerValue(answer: any): string | number {
    if (typeof answer === 'string') {
      return answer.trim() === '' ? 'NA' : answer;
    }
    return answer;
  }

  applyFilter(reset: boolean = false) {

    const questionsToProcess = this.filteredQuestions().length > 0 ? this.filteredQuestions() : this.allQuestions();
    this.reportDetails.set(this.processSurveyData(questionsToProcess).map(item => {
      if (item?.evidences?.length) {
        return {
          ...item,
          evidences: this.utils.mapEvidences(item.evidences)
        };
      }
      return item;
    }))
    
    this.cdr.detectChanges();
    this.observationType() === OBSERVATION_REPORTS_TYPES.QUESTIONS ? this.renderCharts(this.reportDetails(), false) : this.renderCharts(this.reportDetails(), true);
    if (!reset && !this.filteredQuestions().length) {
      this.toaster.showToast('SELECT_ATLEAST_ONE_QUESTION', 'danger');
    }

  }

  resetFilter() {
    this.allQuestions.update((questions) => questions.map((question: any) => ({ ...question, selected: false })));
    this.filteredQuestions.set([]);
    this.applyFilter(true);
  }

  openUrl(evidence: any) {
    window.open(evidence, '_blank');
  }

  isChartNotEmpty(chart: any) {
    return Object.keys(chart).length > 0;
  }

  toggleObservationType(type: any) {
    this.observationType.set(type);
    type == OBSERVATION_REPORTS_TYPES.QUESTIONS ? this.loadObservationReport(this.submissionId(), false, false) : this.loadObservationReport(this.submissionId(), true, false);
  }

  downloadPDF(submissionId: string, criteria: boolean, pdf: boolean,type:any) {
    this.loaded.set(false);
    let payload = this.createPayload(submissionId, criteria, pdf);

    this.apiService.post(urlConfig.survey.reportUrl, payload)
      .pipe(
        finalize(() =>this.loaded.set(true)),
        catchError(() => {
          throw new Error('Could not fetch the details');
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(async (res: any) => {
        if(type === 'download'){
          await this.openUrl(res?.result?.pdfUrl);
          return;
        }
        await this.reports.shareReport(res?.result?.pdfUrl,'observation')
      });
  }
  
  generateName(){
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const formattedDateTime = `${pad(now.getDate())}-${pad(now.getMonth() + 1)}-${now.getFullYear()}-${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
    return `report_${formattedDateTime}`;
  }
  onSelectionChange(submissionId: string): void {
    this.submissionId.set(submissionId);
    this.observationType() == OBSERVATION_REPORTS_TYPES.QUESTIONS ? this.loadObservationReport(submissionId, false, false) : this.loadObservationReport(submissionId, true, false);
  }

  navigateToObservationLedImpPage(){
    this.router.navigate(['/observation-led-imp'], { state: { improvementProjectSuggestions: this.observationDetails()?.improvementProjectSuggestions, programName: this.observationDetails()?.solutionName} });
  }

  allEvidenceClick(question:any){
    const queryParams = {
      submissionId: this.submissionId(),
      observationId: this.observationId(),
      entityId: this.entityId(),
      questionExternalId: question?.order,
      entityType: this.entityType()
    };
    this.router.navigate(['viewAllEvidences'],{
      queryParams:queryParams
    })
  }
}
