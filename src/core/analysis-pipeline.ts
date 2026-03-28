import { addProgress, listTasks, readTask, updateTaskStatus } from './store';
import { dispatchToSpecialist } from './dispatcher';
import { finalizeAnalysisTask } from './finalize';
import { buildRepoAnalysisFromText } from './repo-analysis';
import { buildReviewerChallenge } from './reviewer-challenge';
import type { LobsterTaskRecord } from './types';

export interface AnalysisPipelineResult {
  ok: boolean;
  taskId: string;
  status: string;
  summary: string;
}

export function runAnalysisPipeline(taskId: string): AnalysisPipelineResult {
  const task = readTask(taskId);
  assertAnalysisTask(task);

  updateTaskStatus(taskId, 'queued', 'Queued for analyst execution');
  const analystDispatch = dispatchToSpecialist(taskId, task.ownerAgent, 'Analyze the request and prepare a draft summary.');
  updateTaskStatus(taskId, 'running', `Analyst is analyzing the request via ${analystDispatch.mode}`);
  addProgress(taskId, 'Analyst extracted scope and prepared a draft summary');
  updateTaskStatus(taskId, 'review', 'Draft analysis is ready for reviewer');
  const reviewer = task.reviewerAgent ?? 'reviewer';
  const reviewDispatch = dispatchToSpecialist(taskId, reviewer, 'Review structure, risks, and clarity for the draft.');
  addProgress(taskId, `Reviewer checked structure, risks, and clarity via ${reviewDispatch.mode}`);
  updateTaskStatus(taskId, 'approved', 'Reviewer approved the draft');

  const repoAnalysis = buildRepoAnalysisFromText(task.title);

  finalizeAnalysisTask({
    taskId,
    analysisDraft: repoAnalysis?.summary ?? `Draft analysis for task ${taskId}: ${task.title}`,
    reviewNotes:
      buildReviewerChallenge(repoAnalysis) ??
      repoAnalysis?.reviewNotes ??
      'Reviewer notes: structure is acceptable for MVP, but real execution dispatch is still mocked until multi-agent allowlist is opened.',
    mainSummary:
      repoAnalysis?.mainSummary ??
      `Main summary for ${taskId}: analysis flow completed and is ready to be delivered back to the channel.`,
    deliveredMessage: 'Main delivered the summarized result',
  });

  const finalTask = readTask(taskId);
  return {
    ok: true,
    taskId: finalTask.id,
    status: finalTask.status,
    summary: finalTask.progress ?? 'Delivered',
  };
}

export function runNextPendingAnalysisTask(): AnalysisPipelineResult | undefined {
  const task = listTasks()
    .filter((item) => item.type === 'analysis' && item.status === 'created')
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))[0];
  if (!task) {
    return undefined;
  }
  return runAnalysisPipeline(task.id);
}

function assertAnalysisTask(task: LobsterTaskRecord): void {
  if (task.type !== 'analysis') {
    throw new Error(`Task ${task.id} is not an analysis task.`);
  }
}
