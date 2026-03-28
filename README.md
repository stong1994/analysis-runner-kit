# Analysis Runner Kit

A shareable starter kit for the Lobster-based `analysis runner` built on top of OpenClaw.

## What this is

This kit packages the current analysis workflow into a form that is easier to share with other developers.

Current shape:

- workflow file: `workflows/analysis-runner.lobster`
- implementation source: currently still lives in `openclaw-control-center/src/lobster/*`
- runtime dependency: OpenClaw + Lobster plugin + Lobster CLI

This is a **starter kit / alpha package**, not yet a fully standalone product.

## What it can do today

- create an analysis task
- run the analysis workflow through Lobster
- ingest GitHub repositories
- detect project archetype
- sample key entrypoints
- produce a structured first-pass analysis
- render Discord-friendly delivery output

## Required dependencies

1. OpenClaw installed and running
2. OpenClaw Lobster plugin enabled
3. Lobster CLI installed
4. Node.js 20+
5. The `openclaw-control-center` project in the same workspace

## Enable Lobster plugin

Check the plugin config and enable:

- `plugins.entries.lobster.enabled = true`

## Install Lobster CLI

Current known package:

```bash
npm install -g @clawdbot/lobster
```

Verify:

```bash
lobster --help
```

## Current workflow file

Run from the `openclaw-control-center` directory:

```bash
lobster run lobster/analysis-runner.lobster --args-json '{"request":"分析这个项目 https://github.com/owner/repo"}'
```

## Current limitations

- implementation still depends on `openclaw-control-center/src/lobster/*`
- not yet split into a standalone npm package or plugin
- still a bridge workflow, not a fully native multi-step subagent workflow
- analysis is currently first-pass / code-aware first-pass, not full deep code review

## Recommended next packaging step

Move the reusable logic into a standalone package, for example:

- `packages/analysis-runner-core`
- or a dedicated repo: `analysis-runner-kit`

Then let the Lobster workflow call the shared package entrypoints instead of project-local source paths.
