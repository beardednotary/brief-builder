import { MPA } from '../types';

export interface MPADefinition {
  key: MPA;
  label: string;
  shortLabel: string;
  definition: string;
  blockNumber: number;
}

export const MPA_DEFINITIONS: Record<MPA, MPADefinition> = {
  executing_the_mission: {
    key: 'executing_the_mission',
    label: 'Executing the Mission',
    shortLabel: 'Mission',
    definition:
      'Effectively uses knowledge, initiative, and adaptability to produce timely, high quality/quantity results to positively impact the mission.',
    blockNumber: 1,
  },
  leading_people: {
    key: 'leading_people',
    label: 'Leading People',
    shortLabel: 'People',
    definition:
      'Fosters cohesive teams, effectively communicates, and uses emotional intelligence to take care of people and accomplish the mission.',
    blockNumber: 2,
  },
  managing_resources: {
    key: 'managing_resources',
    label: 'Managing Resources',
    shortLabel: 'Resources',
    definition:
      'Manages assigned resources effectively and takes responsibility for actions/behaviors to maximize organizational performance.',
    blockNumber: 3,
  },
  improving_the_unit: {
    key: 'improving_the_unit',
    label: 'Improving the Unit',
    shortLabel: 'Unit',
    definition:
      'Demonstrates critical thinking and fosters innovation to find creative solutions and improve mission execution.',
    blockNumber: 4,
  },
};

export const MPA_ORDER: MPA[] = [
  'executing_the_mission',
  'leading_people',
  'managing_resources',
  'improving_the_unit',
];

export const MPA_CHAR_LIMIT = 350;
