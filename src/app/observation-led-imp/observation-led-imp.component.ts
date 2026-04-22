import { Router } from '@angular/router';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { ApiService } from '../services/api.service';
import { ToastService } from '../services/toast.service';
import * as urlConfig from '../constants/url-config.json';
import { catchError, finalize } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';


@Component({
  selector: 'app-observation-led-imp',
  standalone: false,
  templateUrl: './observation-led-imp.component.html',
  styleUrl: './observation-led-imp.component.css'
})
export class ObservationLedImpComponent {
  readonly improvementProjectSuggestions = signal<any[]>([]);
  readonly programName = signal<any>('');
  readonly loaded = signal(true);
  private readonly destroyRef = inject(DestroyRef);


  constructor(public router: Router,
    public apiService: ApiService,
    public toaster: ToastService,) {
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras?.state || {};

    this.improvementProjectSuggestions.set(state['improvementProjectSuggestions'] || []);
    this.programName.set(state['programName'] || '');
  }

  navigateToProjectPlayer(project: any) {
    this.loaded.set(false);
    this.apiService.get(urlConfig.observation.project + `${project?._id}`)
      .pipe(
        finalize(() => this.loaded.set(true)),
        catchError((err) => {
          this.toaster.showToast(err?.error?.message, 'danger', 5000)
          throw new Error('Could not fetch the details');
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res: any) => {
        let result = res?.result;
        if (result?.projectId) {
          window.location.href = `/ml/project-details?type=details&id=${result?.projectId}&_id=${result?.projectId}&solutionId=${result?.solutionId}`;
        } else {
          window.location.href = `/ml/project-details?externalId=${project?.externalId}&referenceFrom=observation`;
        }
      });
  }
}
