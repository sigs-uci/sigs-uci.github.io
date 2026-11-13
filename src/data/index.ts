import eventData from './events.json';
import organizationData from './organization.json';
import programData from './programs.json';
import programDetailData from './programDetails.json';
import milestoneData from './milestones.json';
import resourceData from './resources.json';
import migrationData from './migrations.json';
import mediaData from './media.json';
import storyData from './stories.json';
import translationData from './eventTranslations.json';
import type { EventRecord, EventTranslation, MediaRecord, MigrationRecord, MilestoneRecord, OrganizationRecord, ProgramRecord, ProgramDetail, PublicData, ResourceRecord, StoryRecord } from './schema';

export const events = eventData as EventRecord[];
export const organization = organizationData as OrganizationRecord;
export const programs = programData as ProgramRecord[];
export const programDetails = programDetailData as ProgramDetail[];
export const milestones = milestoneData as MilestoneRecord[];
export const resources = resourceData as ResourceRecord[];
export const migrations = migrationData as MigrationRecord[];
export const media = mediaData as MediaRecord[];
export const stories = storyData as StoryRecord[];
export const eventTranslations = translationData as EventTranslation[];

export const data: PublicData = { organization, events, programs, programDetails, milestones, resources, media, stories, eventTranslations, migrations };
export { validatePublicData } from './schema';
export type * from './schema';
