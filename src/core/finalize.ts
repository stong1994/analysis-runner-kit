import { addArtifact, readTask, updateTaskStatus } from './store';

export interface FinalizeAnalysisInput {
  taskId: string;
  analysisDraft: string;
  reviewNotes: string;
  mainSummary: string;
  deliveredMessage?: string;
}

export function finalizeAnalysisTask(input: FinalizeAnalysisInput) {
  addArtifact(input.taskId, {
    kind: 'text',
    label: 'analysis-draft',
    value: input.analysisDraft,
  });
  addArtifact(input.taskId, {
    kind: 'text',
    label: 'review-notes',
    value: input.reviewNotes,
  });
  addArtifact(input.taskId, {
    kind: 'text',
    label: 'main-summary',
    value: input.mainSummary,
  });
  updateTaskStatus(input.taskId, 'delivered', input.deliveredMessage ?? 'Main delivered orchestrated analysis result');
  return readTask(input.taskId);
}
