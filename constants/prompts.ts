import { LogEntry, UserProfile } from '../types';
import { ALQ_DEFINITIONS } from './alq';
import { MPA_DEFINITIONS } from './mpa';
import { PROFICIENCY_DEFINITIONS } from './proficiency';

export interface PromptPayload {
  system: string;
  user: string;
}

export function buildPrompt(entry: LogEntry, profile: UserProfile): PromptPayload {
  const mpa = MPA_DEFINITIONS[entry.mpa];
  const alq = entry.alq ? ALQ_DEFINITIONS[entry.alq] : null;
  const proficiency =
    entry.proficiencyTarget
      ? PROFICIENCY_DEFINITIONS[entry.proficiencyTarget]
      : PROFICIENCY_DEFINITIONS['proficient'];
  const fewShotExample =
    alq && entry.proficiencyTarget ? alq.examples[entry.proficiencyTarget] : '';

  const userInput =
    entry.inputMode === 'structured'
      ? [
          entry.action && `Action: ${entry.action}`,
          entry.outcome && `Outcome: ${entry.outcome}`,
          entry.metrics && `Metrics/Numbers: ${entry.metrics}`,
          entry.context && `Context/Scene: ${entry.context}`,
        ]
          .filter(Boolean)
          .join('\n')
      : (entry.rawText ?? '');

  const afscLine = profile.afscTitle
    ? `${profile.afsc} (${profile.afscTitle})`
    : profile.afsc;

  const system = `You are an expert Air Force EPB (Enlisted Performance Brief) performance statement writer.
You write in narrative-style plain language per the official AF ALQ Writing Guide (Jan 2023).
You are helping an enlisted Airman prepare their own self-assessment input.

RULES:
- Each statement is standalone: [action] + [at least one impact, result, or outcome]
- Target length: 150–175 characters per statement (hard max: 175)
- Use plain English. Only approved AF acronyms (per AFPC list)
- No clichés: avoid "go-to Airman", "consummate professional", "truly outstanding", etc.
- Include quantified data (numbers, percentages, dollar amounts, timeframes) where provided
- Narrative formula: scene + person + action + tool/means = strong statement
- Write in third person using rank (e.g., "${profile.rank} [Last Name] led...")

CONTEXT:
- Ratee Rank: ${profile.rank}
- AFSC: ${afscLine}
- MPA: ${mpa.label}
- MPA Definition: ${mpa.definition}
- ALQ Focus: ${alq ? alq.label : 'General'}
- ALQ Definition: ${alq ? alq.definition : 'Not specified'}
- Target Proficiency Level: ${proficiency.label}
- Proficiency Description: ${proficiency.description}
${fewShotExample ? `\nPROFICIENCY EXAMPLE FOR THIS ALQ:\n${fewShotExample}` : ''}`;

  const user = `INPUT FROM AIRMAN:
${userInput}

OUTPUT:
Generate exactly 2 performance statement options.
Format as:
Option 1: [statement] ({charCount} chars)
Option 2: [statement] ({charCount} chars)

Do not include any preamble, explanation, or markdown. Just the two options.`;

  return { system, user };
}
