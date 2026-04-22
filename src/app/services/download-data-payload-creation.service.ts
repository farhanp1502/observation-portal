import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class DownloadDataPayloadCreationService {

  buildSurveyItem(solution: any) {
    return {
      title: solution?.name,
      subTitle: solution?.surveyExpiry,
      route: `/questionnaire?index=0&submissionId=${solution?.submissionId}&solutionId=${solution?.solutionId}&solutionType=survey`,
      id: solution?.submissionId,
      metaData: {
        solutionId: solution?.solutionId,
        submissionId: solution?.submissionId,
        status: solution?.status,
        statusLabel: solution?.statusLabel
      }
    };
  }

  buildObservationItem(observation: any, observationId: string, entityId: string, allowMultiple: boolean, submissionId: string, subTitle:string) {
    return {
      title: observation?.observationName,
      subTitle: subTitle,
      route: `/details/${observationId}/${entityId}/${allowMultiple}`,
      id: observationId,
      metaData: {
        isRubric: observation?.isRubricDriven,
        observationId,
        submissionId,
        entityId,
        observationName: observation?.title,
        submissionNumber: observation?.submissionNumber,
        observationCreatedDate: observation?.createdAt,
        status: observation?.status,
        evidenceCode: observation?.evidencesStatus?.[0]?.code 
      }
    };
  }
}
