import { ProficiencyLevel } from '../types';

export interface ProficiencyDefinition {
  key: ProficiencyLevel;
  label: string;
  shortLabel: string;
  description: string;
  order: number;
}

export const PROFICIENCY_DEFINITIONS: Record<ProficiencyLevel, ProficiencyDefinition> = {
  needs_improvement: {
    key: 'needs_improvement',
    label: 'Needs Improvement',
    shortLabel: 'NI',
    description: 'Member needs further growth to enhance understanding and/or performance.',
    order: 1,
  },
  developing: {
    key: 'developing',
    label: 'Developing',
    shortLabel: 'Dev',
    description:
      'Member understands the quality and how that quality is illustrated in behavior but requires prompting to consistently demonstrate.',
    order: 2,
  },
  proficient: {
    key: 'proficient',
    label: 'Proficient',
    shortLabel: 'Prof',
    description:
      "Member understands the quality and demonstrates it consistently, illustrated through the Airman's behavior, forming a part of their character.",
    order: 3,
  },
  highly_proficient: {
    key: 'highly_proficient',
    label: 'Highly Proficient',
    shortLabel: 'HP',
    description:
      'Member understands the quality and consistently illustrates it in their behavior while influencing other members in the organization to further develop the same quality.',
    order: 4,
  },
  exceptionally_skilled: {
    key: 'exceptionally_skilled',
    label: 'Exceptionally Skilled',
    shortLabel: 'ES',
    description:
      "Member consistently illustrates this quality in their behavior and proactively influences others' growth in this quality at an organizational scale.",
    order: 5,
  },
};

export const PROFICIENCY_ORDER: ProficiencyLevel[] = [
  'needs_improvement',
  'developing',
  'proficient',
  'highly_proficient',
  'exceptionally_skilled',
];
