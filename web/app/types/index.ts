/**
 * Shared types for scan and report components
 * Dependencies: none
 * Purpose: Type definitions for scan interface
 */
export interface ScanResponse {
  result?: { data?: { jobId?: string; status?: string } };
}

export interface StatusResponse {
  result?: { data?: { 
    status?: string; 
    error?: string;
    progress?: number;
    currentStage?: string;
    stageMessage?: string;
  } };
}

export interface FindingExplanation {
  type: string;
  whatItMeans: string;
  whyItsAProblem: string;
  whoItAffects: string;
  whenItMatters: string;
}

export interface Finding {
  type?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical' | string;
  evidence?: string;
  cwe?: string;
  recommendation?: string;
  explanation?: FindingExplanation;
  title?: string;
  description?: string;
}

export interface DeepSecurity {
  overallScore?: number;
  securityCopyAnalysis?: {
    privacyPolicy?: { found: boolean; score: number };
    securityPage?: { found: boolean; score: number };
  };
  authenticationTesting?: {
    rateLimiting?: { protected: boolean };
    sessionManagement?: { secureCookies: boolean };
  };
  recommendations?: Array<{ priority: string; category: string; issue: string; fix: string }>;
}

export interface VibeCodingVulnerabilities {
  overallRisk?: 'low' | 'medium' | 'high' | 'critical';
  score?: number;
  hardCodedSecrets?: Array<{ type: string; severity: string; evidence: string }>;
  clientSideAuth?: { detected: boolean; risk: string; authImplementation: string };
  unauthenticatedApiAccess?: Array<{ url: string; severity: string; dataType?: string; evidence: string }>;
  backendMisconfigurations?: Array<{ type: string; severity: string; evidence: string }>;
  recommendations?: Array<{ priority: string; category: string; issue: string; fix: string }>;
}

export interface Report {
  url?: string;
  timestamp?: string;
  score?: number;
  summary?: string;
  findings?: Finding[];
  recommendations?: Array<{ priority: string; category: string; issue: string; fix: string }>;
  techStack?: { framework?: string; hosting?: string };
  deepSecurity?: DeepSecurity;
  vibeCodingVulnerabilities?: VibeCodingVulnerabilities;
  [key: string]: unknown;
}

