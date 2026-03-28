import { addProgress, createTask, listTasks, listTasksByStatus, readTask, runDemoFlow, updateTaskStatus } from '../core/store';

function print(value: unknown): void {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

function usage(): never {
  throw new Error('Usage: node --import tsx src/cli/cli.ts <demo|create|list|show|progress|status|list-status> [args...]');
}

function main(): void {
  const [, , command, ...args] = process.argv;

  if (!command) {
    usage();
  }

  switch (command) {
    case 'demo': {
      const title = args.join(' ') || 'Run Lobster MVP demo task';
      print(runDemoFlow(title));
      return;
    }
    case 'create': {
      const title = args.join(' ').trim();
      if (!title) {
        throw new Error('create requires a title');
      }
      print(
        createTask({
          title,
          type: 'analysis',
          ownerAgent: 'analyst',
          reviewerAgent: 'reviewer',
          approvalRequired: true,
        }),
      );
      return;
    }
    case 'list': {
      print(listTasks());
      return;
    }
    case 'list-status': {
      const status = args[0];
      if (!status) {
        throw new Error('list-status requires a status');
      }
      print(listTasksByStatus(status as never));
      return;
    }
    case 'show': {
      const taskId = args[0];
      if (!taskId) {
        throw new Error('show requires a task id');
      }
      print(readTask(taskId));
      return;
    }
    case 'progress': {
      const [taskId, ...messageParts] = args;
      if (!taskId || messageParts.length === 0) {
        throw new Error('progress requires <taskId> <message>');
      }
      print(addProgress(taskId, messageParts.join(' ')));
      return;
    }
    case 'status': {
      const [taskId, status, ...messageParts] = args;
      if (!taskId || !status || messageParts.length === 0) {
        throw new Error('status requires <taskId> <status> <message>');
      }
      print(updateTaskStatus(taskId, status as never, messageParts.join(' ')));
      return;
    }
    default:
      usage();
  }
}

main();
