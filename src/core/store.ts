import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import type {
  CreateLobsterTaskInput,
  LobsterTaskArtifact,
  LobsterTaskEvent,
  LobsterTaskRecord,
  LobsterTaskStatus,
} from './types';

const projectRoot = process.cwd();
const dataRoot = path.join(projectRoot, '.analysis-runner-kit-data');
const tasksDir = path.join(dataRoot, 'tasks');
const artifactsDir = path.join(dataRoot, 'artifacts');
const logsDir = path.join(dataRoot, 'logs');

function ensureDirs(): void {
  for (const dir of [dataRoot, tasksDir, artifactsDir, logsDir]) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function nowIso(): string {
  return new Date().toISOString();
}

function taskPath(taskId: string): string {
  return path.join(tasksDir, `${taskId}.json`);
}

function event(type: LobsterTaskEvent['type'], message: string): LobsterTaskEvent {
  return {
    id: randomUUID(),
    type,
    message,
    createdAt: nowIso(),
  };
}

function nextTaskId(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const stamp = `${yyyy}${mm}${dd}`;
  const files = fs.existsSync(tasksDir) ? fs.readdirSync(tasksDir) : [];
  const todays = files.filter((name) => name.startsWith(`task-${stamp}-`) && name.endsWith('.json'));
  const seq = String(todays.length + 1).padStart(3, '0');
  return `task-${stamp}-${seq}`;
}

export function createTask(input: CreateLobsterTaskInput): LobsterTaskRecord {
  ensureDirs();
  const timestamp = nowIso();
  const record: LobsterTaskRecord = {
    id: nextTaskId(),
    title: input.title,
    type: input.type,
    status: 'created',
    ownerAgent: input.ownerAgent,
    reviewerAgent: input.reviewerAgent,
    requester: input.requester,
    channel: input.channel,
    sourceMessageId: input.sourceMessageId,
    approvalRequired: input.approvalRequired ?? false,
    summary: input.summary,
    progress: 'Task created',
    artifacts: [],
    events: [
      event('created', `Task created for ${input.type}`),
      event('assigned', `Assigned to ${input.ownerAgent}`),
    ],
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  saveTask(record);
  return record;
}

export function saveTask(record: LobsterTaskRecord): void {
  ensureDirs();
  fs.writeFileSync(taskPath(record.id), JSON.stringify(record, null, 2));
}

export function readTask(taskId: string): LobsterTaskRecord {
  return JSON.parse(fs.readFileSync(taskPath(taskId), 'utf8')) as LobsterTaskRecord;
}

export function listTasks(): LobsterTaskRecord[] {
  ensureDirs();
  return fs
    .readdirSync(tasksDir)
    .filter((name) => name.endsWith('.json'))
    .sort()
    .map((name) => JSON.parse(fs.readFileSync(path.join(tasksDir, name), 'utf8')) as LobsterTaskRecord);
}

export function listTasksByStatus(status: LobsterTaskStatus): LobsterTaskRecord[] {
  return listTasks().filter((task) => task.status === status);
}

export function updateTaskStatus(taskId: string, status: LobsterTaskStatus, message: string): LobsterTaskRecord {
  const record = readTask(taskId);
  record.status = status;
  record.progress = message;
  record.updatedAt = nowIso();
  record.events.push(event('status_changed', `${status}: ${message}`));
  saveTask(record);
  return record;
}

export function addProgress(taskId: string, message: string): LobsterTaskRecord {
  const record = readTask(taskId);
  record.progress = message;
  record.updatedAt = nowIso();
  record.events.push(event('progress', message));
  saveTask(record);
  return record;
}

export function addArtifact(taskId: string, artifact: Omit<LobsterTaskArtifact, 'id' | 'createdAt'>): LobsterTaskRecord {
  const record = readTask(taskId);
  record.artifacts.push({
    id: randomUUID(),
    createdAt: nowIso(),
    ...artifact,
  });
  record.updatedAt = nowIso();
  record.events.push(event('artifact_added', `Added artifact: ${artifact.label}`));
  saveTask(record);
  return record;
}

export function runDemoFlow(title: string): LobsterTaskRecord {
  const task = createTask({
    title,
    type: 'analysis',
    ownerAgent: 'analyst',
    reviewerAgent: 'reviewer',
    approvalRequired: true,
    summary: 'Demo analysis flow for Lobster MVP',
  });
  updateTaskStatus(task.id, 'queued', 'Queued for execution');
  updateTaskStatus(task.id, 'running', 'Analyst is collecting context');
  addProgress(task.id, 'Reviewer will be requested after draft is ready');
  addArtifact(task.id, {
    kind: 'text',
    label: 'draft-summary',
    value: 'Draft summary: Lobster task system MVP demo completed.',
  });
  updateTaskStatus(task.id, 'review', 'Draft ready for reviewer');
  addProgress(task.id, 'Reviewer approved structure and next steps');
  updateTaskStatus(task.id, 'approved', 'Approved for delivery');
  updateTaskStatus(task.id, 'delivered', 'Delivered result to channel');
  return readTask(task.id);
}
