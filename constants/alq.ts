import { ALQ, MPA, ProficiencyLevel } from '../types';

export interface ALQDefinition {
  key: ALQ;
  label: string;
  mpa: MPA;
  definition: string;
  examples: Record<ProficiencyLevel, string>;
}

export const ALQ_DEFINITIONS: Record<ALQ, ALQDefinition> = {
  job_proficiency: {
    key: 'job_proficiency',
    label: 'Job Proficiency',
    mpa: 'executing_the_mission',
    definition:
      'Demonstrates knowledge and professional skill in assigned duties, achieving positive results and impact in support of the mission.',
    examples: {
      needs_improvement:
        'SrA Smith completed required tasks but needed supervisory guidance to ensure compliance with technical order procedures during scheduled maintenance.',
      developing:
        'When directed, SrA Smith performed maintenance IAW technical orders and, with supervisor guidance, identified a recurring fault in the aircraft avionics system.',
      proficient:
        'SrA Smith identified and corrected a critical avionics fault during preflight, applying technical order knowledge to restore full mission capability within 2 hours.',
      highly_proficient:
        'SrA Smith identified a recurring avionics fault affecting 3 aircraft, diagnosed root cause using technical order mastery, and mentored 2 junior Airmen in corrective procedures.',
      exceptionally_skilled:
        'Identifying a systemic avionics fault across the fleet, SrA Smith diagnosed root cause, briefed leadership on corrective actions, and developed a revised inspection checklist adopted unit-wide.',
    },
  },

  initiative: {
    key: 'initiative',
    label: 'Initiative',
    mpa: 'executing_the_mission',
    definition:
      'Assesses and takes independent or directed action to complete a task or mission that influences the mission or organization.',
    examples: {
      needs_improvement:
        'After being prompted by leadership, SrA Smith volunteered to assist with wing inspection preparation and completed assigned tasks on time.',
      developing:
        'When asked, SrA Smith identified a scheduling gap during the deployment and, with leadership support, coordinated with adjacent units to fill the shortfall.',
      proficient:
        'SrA Smith identified a scheduling gap during the deployment and independently coordinated with 3 adjacent units to fill the shortfall, ensuring 100% coverage.',
      highly_proficient:
        'SrA Smith identified a scheduling gap, independently developed a cross-functional coverage plan, and coached 2 NCOs on coordination procedures to prevent future gaps.',
      exceptionally_skilled:
        'Recognizing a systemic scheduling vulnerability, SrA Smith developed an automated tracker, briefed the Flight Chief, and trained the entire section—eliminating recurring coverage gaps.',
    },
  },

  adaptability: {
    key: 'adaptability',
    label: 'Adaptability',
    mpa: 'executing_the_mission',
    definition:
      'Adjusts to changing conditions, to include plans, information, processes, requirements and obstacles in accomplishing the mission.',
    // Official examples from AF ALQ Writing Guide (Jan 2023)
    examples: {
      needs_improvement:
        'MSgt Bailey learned a Primary Care Team member tested COVID positive, and, after being prompted, notified her Flight Commander at morning huddle, while waiting for direction on future actions to take.',
      developing:
        'When MSgt Bailey learned a Primary Care Team member tested COVID positive, she notified her Flight Commander, and, with direction from her leadership, her team was able to determine a plan to resolve the issue.',
      proficient:
        'Learning a Primary Care Team member tested COVID positive, MSgt Bailey responded professionally with appropriate action adjusting the daily schedule and created a new plan ensuring team coverage.',
      highly_proficient:
        'MSgt Bailey learned a Primary Care Team member tested COVID positive and, without prompting, empowered a SSgt as Team leader deciding on adjustments, ensuring team coverage and mission accomplishment.',
      exceptionally_skilled:
        'When a Primary Care Team member tested COVID positive, MSgt Bailey independently acted to empower a SSgt as Team lead ensuring coverage, mentoring them to create/brief new plans to Medical Group for process improvement.',
    },
  },

  inclusion_teamwork: {
    key: 'inclusion_teamwork',
    label: 'Inclusion & Teamwork',
    mpa: 'leading_people',
    definition:
      'Collaborates effectively with others to achieve an inclusive climate in pursuit of a common goal or to complete a task or mission.',
    examples: {
      needs_improvement:
        'SrA Smith participated in team projects when directed and was responsive to teammates\' requests for assistance.',
      developing:
        'SrA Smith collaborated with teammates on the unit fundraiser and, with encouragement from supervisors, helped integrate a new Airman into the team.',
      proficient:
        'SrA Smith organized a cross-functional team for the unit\'s charity event, ensuring all members had defined roles and resulting in $2,000 raised for the base family support center.',
      highly_proficient:
        'SrA Smith built a 6-person cross-functional team to address the unit\'s training backlog, mentoring junior members on collaboration and reducing overdue training by 40%.',
      exceptionally_skilled:
        'SrA Smith developed an inclusive team charter adopted across the squadron, trained 12 NCOs on collaborative leadership, and drove a 30% improvement in unit climate survey scores.',
    },
  },

  emotional_intelligence: {
    key: 'emotional_intelligence',
    label: 'Emotional Intelligence',
    mpa: 'leading_people',
    definition:
      "Exercises self-awareness, manages their own emotions effectively; demonstrates an understanding of others' emotions, and appropriately manages relationships.",
    examples: {
      needs_improvement:
        'SrA Smith maintained composure in most situations and sought supervisor input before addressing interpersonal issues in the section.',
      developing:
        'During a high-tempo deployment, SrA Smith recognized tension among team members and, after consulting with supervisors, helped mediate a resolution.',
      proficient:
        'During a high-tempo surge, SrA Smith recognized morale issues within the section, proactively coordinated a team debrief, and reduced conflict—maintaining mission focus throughout.',
      highly_proficient:
        'SrA Smith identified early signs of burnout in 3 teammates, facilitated individual check-ins and coordinated available resources, maintaining team cohesion throughout a 6-month deployment.',
      exceptionally_skilled:
        'SrA Smith developed a peer support check-in protocol adopted across the flight, trained 8 NCOs in stress recognition techniques, and reduced supervisor-reported interpersonal conflicts by 50%.',
    },
  },

  communication: {
    key: 'communication',
    label: 'Communication',
    mpa: 'leading_people',
    definition:
      'Articulates information in a clear and timely manner, both verbally and non-verbally, through active listening and messaging tailored to the appropriate audience.',
    examples: {
      needs_improvement:
        'SrA Smith completed required briefings when directed and passed information to teammates as requested.',
      developing:
        'SrA Smith provided daily status updates to the team and, with supervisor coaching, improved clarity in written reports submitted to the Flight Chief.',
      proficient:
        'SrA Smith developed a standardized daily status brief, eliminating redundant communication and saving 30 minutes of leadership time per day during the deployment cycle.',
      highly_proficient:
        "SrA Smith redesigned the section's shift turnover process, trained 5 NCOs on structured communication techniques, and reduced handoff errors by 25%.",
      exceptionally_skilled:
        'SrA Smith authored a communication SOP adopted across 3 flights, trained 15 Airmen in audience-tailored messaging, and was recognized by the Squadron Commander for improving mission reporting accuracy.',
    },
  },

  stewardship: {
    key: 'stewardship',
    label: 'Stewardship',
    mpa: 'managing_resources',
    definition:
      'Demonstrates responsible management of assigned resources, which may include time, equipment, people, funds and/or facilities.',
    examples: {
      needs_improvement:
        'SrA Smith accounted for assigned equipment when directed and reported discrepancies to the supervisor.',
      developing:
        "SrA Smith managed the section's vehicle log and, with leadership guidance, identified 2 overdue maintenance items and scheduled corrective actions.",
      proficient:
        'SrA Smith conducted a comprehensive inventory of $500K in section equipment, identified 3 discrepancies, and reconciled all records in time for the annual inspection with zero findings.',
      highly_proficient:
        'SrA Smith managed a $2M equipment account, identified a recurring maintenance scheduling gap, developed a corrective tracker, and trained 4 Airmen on proper accountability procedures.',
      exceptionally_skilled:
        "SrA Smith redesigned the unit's equipment accountability system, trained 10 personnel, and eliminated chronic inspection discrepancies—saving the unit an estimated 80 man-hours annually.",
    },
  },

  accountability: {
    key: 'accountability',
    label: 'Accountability',
    mpa: 'managing_resources',
    definition:
      'Takes responsibility for the actions and behaviors of self and/or team; demonstrates reliability and transparency.',
    examples: {
      needs_improvement:
        'SrA Smith completed assigned tasks and reported issues to the supervisor when encountered.',
      developing:
        'When a procedural error was identified in the section, SrA Smith acknowledged the mistake and worked with leadership to implement corrective actions.',
      proficient:
        'SrA Smith identified a procedural error in the maintenance log, self-reported to leadership, and developed a corrective action plan that prevented recurrence during the next inspection cycle.',
      highly_proficient:
        'SrA Smith identified a systemic reporting error, self-reported to leadership, implemented corrective training for 6 teammates, and ensured zero discrepancies during the IG inspection.',
      exceptionally_skilled:
        "SrA Smith established a section-level accountability standard, trained 12 Airmen on reporting procedures, and led the flight to a 100% compliance rating during the wing's Unit Effectiveness Inspection.",
    },
  },

  decision_making: {
    key: 'decision_making',
    label: 'Decision Making',
    mpa: 'improving_the_unit',
    definition:
      "Makes well-informed, effective and timely decisions under one's control that weigh constraints, risks, and benefits.",
    examples: {
      needs_improvement:
        'SrA Smith requested supervisor guidance before making decisions that fell outside routine task parameters.',
      developing:
        'When faced with an unexpected equipment failure, SrA Smith consulted with supervisors, identified 2 options, and implemented the approved course of action with minimal mission impact.',
      proficient:
        'When an aircraft component failed during pre-mission checks, SrA Smith assessed the fault, weighed replacement timeline against mission priority, and briefed leadership—enabling a 2-hour delay vs. mission cancellation.',
      highly_proficient:
        'SrA Smith evaluated 3 courses of action for a scheduling conflict affecting 20 personnel, presented risks and tradeoffs to leadership, and implemented the selected option with zero mission disruption.',
      exceptionally_skilled:
        'SrA Smith developed a decision-support framework for scheduling conflicts, trained 8 NCOs in risk-based analysis, and reduced escalations to senior leadership by 35% during peak operational tempo.',
    },
  },

  innovation: {
    key: 'innovation',
    label: 'Innovation',
    mpa: 'improving_the_unit',
    definition:
      'Thinks creatively about different ways to solve problems, implements improvements and demonstrates calculated risk-taking.',
    examples: {
      needs_improvement:
        'SrA Smith suggested a process improvement when prompted by supervisors and assisted in implementing the approved change.',
      developing:
        'SrA Smith identified a repetitive task in the section workflow and, with supervisor approval, proposed a streamlined process that was piloted in the unit.',
      proficient:
        'SrA Smith designed a SharePoint-based tracker for section training records, reducing manual data entry by 3 hours per week and improving accuracy for 30 personnel.',
      highly_proficient:
        'SrA Smith developed an automated equipment tracking tool, trained 6 teammates on its use, and reduced monthly inventory reconciliation time from 4 hours to 45 minutes.',
      exceptionally_skilled:
        'SrA Smith engineered a unit-wide digital scheduling system, presented it to the Group Commander, and drove adoption across 4 flights—saving an estimated 200 man-hours per quarter.',
    },
  },
};

export const ALQ_MPA_MAP: Record<MPA, ALQ[]> = {
  executing_the_mission: ['job_proficiency', 'initiative', 'adaptability'],
  leading_people: ['inclusion_teamwork', 'emotional_intelligence', 'communication'],
  managing_resources: ['stewardship', 'accountability'],
  improving_the_unit: ['decision_making', 'innovation'],
};

export const ALQ_LABELS: Record<ALQ, string> = Object.fromEntries(
  Object.values(ALQ_DEFINITIONS).map((d) => [d.key, d.label])
) as Record<ALQ, string>;
