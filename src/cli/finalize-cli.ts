import { finalizeAnalysisTask } from '../core/finalize';

const [, , taskId, analysisDraft, reviewNotes, mainSummary] = process.argv;
if (!taskId || !analysisDraft || !reviewNotes || !mainSummary) {
  throw new Error(
    'Usage: node --import tsx src/cli/finalize-cli.ts <taskId> <analysisDraft> <reviewNotes> <mainSummary>',
  );
}

process.stdout.write(
  `${JSON.stringify(
    finalizeAnalysisTask({
      taskId,
      analysisDraft,
      reviewNotes,
      mainSummary,
      deliveredMessage: 'Main delivered the summarized result',
    }),
    null,
    2,
  )}\n`,
);
