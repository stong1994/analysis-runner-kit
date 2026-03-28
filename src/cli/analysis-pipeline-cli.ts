import { runAnalysisPipeline, runNextPendingAnalysisTask } from '../core/analysis-pipeline';

function print(value: unknown): void {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

function main(): void {
  const [, , taskId] = process.argv;
  if (taskId) {
    print(runAnalysisPipeline(taskId));
    return;
  }

  const result = runNextPendingAnalysisTask();
  if (!result) {
    print({ ok: true, message: 'No pending analysis task found.' });
    return;
  }

  print(result);
}

main();
