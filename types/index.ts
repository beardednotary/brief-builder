export type AirmanRank =
  | 'AB'
  | 'Amn'
  | 'A1C'
  | 'SrA'
  | 'SSgt'
  | 'TSgt'
  | 'MSgt'
  | 'SMSgt'
  | 'CMSgt';

export type MPA =
  | 'executing_the_mission'
  | 'leading_people'
  | 'managing_resources'
  | 'improving_the_unit';

export type ALQ =
  | 'job_proficiency'
  | 'initiative'
  | 'adaptability'
  | 'inclusion_teamwork'
  | 'emotional_intelligence'
  | 'communication'
  | 'stewardship'
  | 'accountability'
  | 'decision_making'
  | 'innovation';

export type ProficiencyLevel =
  | 'needs_improvement'
  | 'developing'
  | 'proficient'
  | 'highly_proficient'
  | 'exceptionally_skilled';

export type Component = 'RegAF' | 'AFR' | 'ANG';

export interface UserProfile {
  name?: string;
  rank: AirmanRank;
  afsc: string;
  afscTitle?: string;
  component: Component;
  reportingPeriodEnd?: string;
  isPro: boolean;
}

export interface LogEntry {
  id: string;
  createdAt: string;
  eventDate?: string;

  inputMode: 'freeform' | 'structured';

  // Freeform
  rawText?: string;

  // Structured
  action?: string;
  outcome?: string;
  metrics?: string;
  context?: string;

  mpa: MPA;
  alq?: ALQ;
  proficiencyTarget?: ProficiencyLevel;

  draftStatements?: string[];
  /** How many times AI has written statements for this entry. */
  writeCount?: number;
  selectedStatement?: string;
  characterCount?: number;

  isFavorited: boolean;
  status: 'draft' | 'polished' | 'finalized';
}

export interface MPABlock {
  mpa: MPA;
  statements: string[];
  characterCount: number;
}
