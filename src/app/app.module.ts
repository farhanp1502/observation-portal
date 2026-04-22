import { NgModule,CUSTOM_ELEMENTS_SCHEMA  } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import {
  MatNativeDateModule
} from '@angular/material/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ListingComponent } from './listing/listing.component';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSliderModule } from '@angular/material/slider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatListModule } from '@angular/material/list';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { MatExpansionModule } from '@angular/material/expansion';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CommonModule, DatePipe } from '@angular/common';
import { HTTP_INTERCEPTORS, HttpClient, HttpClientModule } from '@angular/common/http';
import { SpinnerComponent } from './shared/spinner/spinner.component';
import { ApiInterceptor } from './services/api.interceptor';
import { ObservationEntityComponent } from './observation-entity/observation-entity.component';
import { ObservationDetailsComponent } from './observation-details/observation-details.component';
import { ObservationDomainComponent } from './observation-domain/observation-domain.component';
import { QuestionnaireComponent } from './questionnaire/questionnaire.component';
import { ReportComponent } from './report/report.component';
import { 
  TranslateLoader,
  TranslateModule,
  TranslateService,
} from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { ObservationLedImpComponent } from './observation-led-imp/observation-led-imp.component';
import { ObservationAsTaskComponent } from './observation-as-task/observation-as-task.component';
import { DeeplinkRedirectComponent } from './deeplink-redirect/deeplink-redirect.component';
import { MatChipsModule } from '@angular/material/chips';
import { SurveyReportsComponent } from './survey-reports/survey-reports.component';
import { SurveyPreviewComponent } from './shared/survey-preview/survey-preview.component';
import { DownloadsComponent } from './downloads/downloads.component';
import { SurveyExpiredComponent } from './survey-expired/survey-expired.component';
import { ViewEvidencesComponent } from './shared/view-evidences/view-evidences.component';
import { GenericPopupComponent } from './shared/generic-popup/generic-popup.component';
import { NoDataComponent } from './shared/no-data/no-data.component';
import { MainContentComponent } from './shared/main-content/main-content.component';
import { ServiceWorkerModule } from '@angular/service-worker';
import { ShareLinkPopupComponent } from './shared/share-link-popup/share-link-popup.component';
import { ShortUrlPipe } from './shared/pipes/short-url.pipe';
import { DownloadButtonComponent } from './shared/download-button/download-button.component';
import { InfiniteScrollModule } from 'ngx-infinite-scroll';
import { AddEntityPopupComponent } from './shared/add-entity-popup/add-entity-popup.component';
import { ProfileAlterPopupComponent } from './shared/profile-alter-popup/profile-alter-popup.component';
import { CleanAnswersPipe } from './pipes/clean-answers.pipe';
import { NotFoundComponent } from './not-found/not-found.component';
import { EntityFilterPopupComponent } from './shared/entity-filter-popup/entity-filter-popup.component';
import { ReportsFilterModal } from './shared/reports-filter-modal/reports-filter-modal';

export function translateHttpLoaderFactory(httpClient: HttpClient) {
  return new TranslateHttpLoader(httpClient, './assets/i18n/', '.json');
}

@NgModule({
  declarations: [
    AppComponent,
    ListingComponent,
    SpinnerComponent,
    ObservationEntityComponent,
    ObservationDetailsComponent,
    ObservationDomainComponent,
    QuestionnaireComponent,
    ReportComponent,
    ObservationLedImpComponent,
    ObservationAsTaskComponent,
    DeeplinkRedirectComponent,
    SurveyReportsComponent,
    SurveyPreviewComponent,
    DownloadsComponent,
    SurveyExpiredComponent,
    ViewEvidencesComponent,
    GenericPopupComponent,
    NoDataComponent,
    MainContentComponent,
    ShareLinkPopupComponent,
    ShortUrlPipe,
    DownloadButtonComponent,
    AddEntityPopupComponent,
    ProfileAlterPopupComponent,
    CleanAnswersPipe,
    NotFoundComponent,
    EntityFilterPopupComponent,
    ReportsFilterModal
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    CommonModule,
    BrowserAnimationsModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatCheckboxModule,
    MatSliderModule,
    MatFormFieldModule,
    MatListModule,
    MatInputModule,
    MatRadioModule,
    MatIconModule,
    MatButtonModule,
    MatDialogModule,
    MatDividerModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatTooltipModule,
    MatPaginatorModule,
    HttpClientModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatGridListModule,
    MatToolbarModule,
    MatTabsModule,
    MatMenuModule,
    MatSelectModule,
    MatExpansionModule,
    MatChipsModule,
    InfiniteScrollModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: translateHttpLoaderFactory,
        deps: [HttpClient]
      }
    }),
    ServiceWorkerModule.register('ngsw-worker.js', {
      enabled: true,
      registrationStrategy: 'registerWhenStable:30000'
    })
  ],
  providers: [
    DatePipe,
    {
      provide:HTTP_INTERCEPTORS,
      useClass:ApiInterceptor,
      multi:true
    },
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  bootstrap: [AppComponent],
  
})
export class AppModule { 
  constructor(private translate:TranslateService){
    this.setLanguage();
  }
  setLanguage() {
    this.translate.setDefaultLang('en');
    this.translate.use('en');
    let theme:any=JSON.parse(localStorage.getItem('theme'))
    if(theme){
      document.documentElement.style.setProperty('--color-primary', theme?.primaryColor);
      document.documentElement.style.setProperty('--primary-color', theme?.primaryColor);
      document.documentElement.style.setProperty('--color-secondary', theme?.secondaryColor);
    }
  }
}
