export type LobsterTaskType =
  | 'analysis'
  | 'digest'
  | 'coding'
  | 'review'
  | 'design'
  | 'test'
  | 'ops'
  | 'automation';

export type LobsterTaskStatus =
  | 'created'
  | 'queued'
  | 'running'
  | 'blocked'
  | 'review'
  | 'approved'
  | 'delivered'
  | 'failed'
  | 'cancelled';

export interface LobsterTaskArtifact {
  id: string;
  kind: 'text' | 'file' | 'link';
  label: string;
  value: string;
  createdAt: string;
}

export interface LobsterTaskEvent {
  id: string;
  type: 'created' | 'assigned' | 'status_changed' | 'progress' | 'artifact_added' | 'reviewed' | 'delivered' | 'failed';
  message: string;
  createdAt: string;
}

export interface LobsterTaskRecord {
  id: string;
  title: string;
  type: LobsterTaskType;
  status: LobsterTaskStatus;
  ownerAgent: string;
  reviewerAgent?: string;
  requester?: string;
  channel?: string;
  sourceMessageId?: string;
  approvalRequired: boolean;
  progress?: string;
  summary?: string;
  artifacts: LobsterTaskArtifact[];
  events: LobsterTaskEvent[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateLobsterTaskInput {
  title: string;
  type: LobsterTaskType;
  ownerAgent: string;
  reviewerAgent?: string;
  requester?: string;
  channel?: string;
  sourceMessageId?: string;
  approvalRequired?: boolean;
  summary?: string;
}
