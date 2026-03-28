# Analysis Runner Kit

A shareable starter kit for the Lobster-based `analysis runner` built on top of OpenClaw.

## What this is

This kit packages the current analysis workflow into a form that is easier to share with other developers.

Current shape:

- workflow file: `workflows/analysis-runner.lobster`
- core implementation: `src/core/*`
- CLI entrypoints: `src/cli/*`
- runtime dependency: OpenClaw + Lobster plugin + Lobster CLI

This is now a **runnable starter kit**, though it is still not a fully productized standalone plugin.

## What it can do today

- create an analysis task
- run the analysis workflow through Lobster
- ingest GitHub repositories
- detect project archetype
- sample key entrypoints
- produce a structured first-pass analysis
- add reviewer challenge notes
- render Discord-friendly delivery output

## Required dependencies

1. OpenClaw installed and running
2. OpenClaw Lobster plugin enabled
3. Lobster CLI installed
4. Node.js 20+
5. npm available

## Enable Lobster plugin

Check the plugin config and enable:

- `plugins.entries.lobster.enabled = true`

## Install Lobster CLI

```bash
npm install -g @clawdbot/lobster
```

Verify:

```bash
lobster --help
```

## Install this starter kit

From the kit directory:

```bash
npm install
```

## Run the workflow

From the `analysis-runner-kit` directory:

```bash
lobster run workflows/analysis-runner.lobster --args-json '{"request":"分析这个项目 https://github.com/owner/repo"}'
```

## Read the result

List tasks:

```bash
node --import tsx src/cli/cli.ts list
```

Render the latest delivery:

```bash
node --import tsx src/cli/delivery-cli.ts <taskId>
```

## Extraction boundary

Already extracted into this kit:

- `workflows/analysis-runner.lobster`
- `src/core/store.ts`
- `src/core/analysis-pipeline.ts`
- `src/core/finalize.ts`
- `src/core/repo-ingest.ts`
- `src/core/repo-analysis.ts`
- `src/core/reviewer-challenge.ts`
- `src/core/delivery.ts`
- minimal CLI entrypoints under `src/cli/*`
- local task data storage under `.analysis-runner-kit-data/`

Not fully extracted yet / still incomplete at the product boundary:

- runtime-native multi-step orchestration beyond the current bridge workflow shape
- deeper failure/retry/recovery hardening for production use
- richer reviewer evidence challenge and deeper code-reading coverage
- broader packaging work if this should become a standalone npm package or OpenClaw plugin
- complete decoupling from the broader OpenClaw + Lobster runtime dependency model

## Current limitations

- still a bridge workflow, not a fully native multi-step subagent workflow
- analysis is currently first-pass / code-aware first-pass, not full deep code review
- result rendering is optimized for Discord text delivery, not yet interactive components
- task storage is local to `.analysis-runner-kit-data/`

## Recommended next packaging step

Move the reusable logic into a cleaner standalone package boundary, for example:

- `packages/analysis-runner-core`
- or continue evolving this repo into a standalone public starter kit

Then separate runtime-agnostic analysis logic from OpenClaw/Lobster-specific workflow wiring.
