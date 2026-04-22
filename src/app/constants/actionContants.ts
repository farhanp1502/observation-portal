import urlConfig from '../constants/url-config.json';
interface ListingItemConfig {
  title: string;
  solutionType: string;
  description: string;
  placeholder: string;
  searchTerm?: string;
  urlPath: string;
  isObservation?: boolean;
  surveyPage?: boolean;
  surveyReports?: boolean;
  showSearch?: boolean;
}

export interface ListingConfig {
  observation: ListingItemConfig;
  survey: ListingItemConfig;
  observationReports: ListingItemConfig;
  surveyReports: ListingItemConfig;
}

export const listingConfig:ListingConfig ={
    observation:{
      title:'Observation',
      solutionType:'observation',
      description:'OBSERVATION_LISTING_MESSAGE',
      placeholder:'SEARCH_PLACEHOLDER',
      searchTerm:'',
      urlPath:urlConfig.observation.listing+'observation&search=',
      isObservation:true,
    },
    survey :{
      title:'Survey',
      solutionType:'survey',
      description:'SURVEY_DESC',
      placeholder:'SEARCH_PLACEHOLDER',
      searchTerm:'',
      urlPath:urlConfig.observation.listing+'survey&surveyReportPage=false&search=',
      surveyPage:true,
    },
    observationReports:{
      title:'Observation Reports',
      solutionType:'observation',
      description:'OBSERVATION_REPORTS_DESC',
      placeholder:'SEARCH_PLACEHOLDER',
      showSearch:true,
      urlPath:urlConfig.observation.reportListing,
      isObservation:true,
    },
    surveyReports:{
      title:'Survey Reports',
      solutionType:'survey',
      description:'SURVEY_DESC',
      placeholder:'SEARCH_PLACEHOLDER',
      searchTerm:'',
      urlPath:urlConfig.observation.listing+'survey&surveyReportPage=true&search=',
      surveyReports:true,
    }
}


export const dialogConfirmationMap ={
  observeAgain:{
    title:'OBSERVE_AGAIN',
    close:true,
    message:'OBSERVE_AGAIN_MSG',
  },
  downloadPop:{
    message:'DOWNLOAD_MSG'
  }
}

export const surveyStatusMap = {
  expired:{
    path:'assets/images/survey-expired.svg',
    text:'SURVEY_EXPIRED_MSG'
  },
  completed:{
    path:'assets/images/submitted.svg',
    text:'SURVEY_COMPLETED_MSG'
  }
}

export const  statusMappings = {
  'active': { tagClass: 'tag-not-started', statusLabel: 'Not Started' },
  'draft': { tagClass: 'tag-in-progress', statusLabel: 'In Progress' },
  'started': { tagClass: 'tag-in-progress', statusLabel: 'In Progress' },
  'completed': { tagClass: 'tag-completed', statusLabel: 'Completed' },
  'expired': { tagClass: 'tag-expired', statusLabel: 'Expired' }
};

export const OBSERVATION_REPORTS_TYPES = {
  QUESTIONS: 'questions',
  QUESTION_LABEL: 'question',
  CRITERIA_LABEL: 'criteriaName'
};

export interface ReportsQuestion {
  id: number | string;
  selected: boolean;
  [key: string]: any;
}