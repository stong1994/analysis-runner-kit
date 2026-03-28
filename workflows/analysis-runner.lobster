name: analysis-runner
args:
  request:
    default: ""
steps:
  - id: task-create
    command: node --import tsx src/cli/cli.ts create "${request}"

  - id: task-id
    command: node -e 'const task = JSON.parse(process.argv[1]); console.log(task.id)' '$task-create.stdout'

  - id: task-show-created
    command: node --import tsx src/cli/cli.ts show $task-id.stdout

  - id: analysis-fallback
    command: node --import tsx src/cli/analysis-pipeline-cli.ts $task-id.stdout

  - id: task-show-after-analysis
    command: node --import tsx src/cli/cli.ts show $task-id.stdout

  - id: delivery
    command: node --import tsx src/cli/delivery-cli.ts $task-id.stdout

  - id: output
    command: echo "analysis runner workflow completed"
