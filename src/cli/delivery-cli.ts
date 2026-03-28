import { buildDeliveredTaskSummary } from '../core/delivery';

const [, , taskId] = process.argv;
if (!taskId) {
  throw new Error('Usage: node --import tsx src/cli/delivery-cli.ts <taskId>');
}
process.stdout.write(`${buildDeliveredTaskSummary(taskId)}\n`);
