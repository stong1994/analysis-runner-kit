# Setup Guide

## 1. Prerequisites

Make sure the host has:

- OpenClaw installed
- Node.js 20+
- npm available
- access to the project workspace

## 2. Enable the Lobster plugin in OpenClaw

Required config:

- `plugins.entries.lobster.enabled = true`

After enabling, restart the gateway if needed.

## 3. Install Lobster CLI

```bash
npm install -g @clawdbot/lobster
```

Verify:

```bash
lobster version
lobster --help
```

## 4. Go to the starter kit directory

```bash
cd analysis-runner-kit
```

## 5. Install starter kit dependencies

```bash
npm install
```

## 6. Run the workflow

Example:

```bash
lobster run workflows/analysis-runner.lobster --args-json '{"request":"分析这个项目 https://github.com/affaan-m/everything-claude-code"}'
```

## 7. Read the result

Get the latest task:

```bash
node --import tsx src/cli/cli.ts list
```

Render the delivery:

```bash
node --import tsx src/cli/delivery-cli.ts <taskId>
```

## 8. Local data directory

This starter kit writes task data into:

```bash
.analysis-runner-kit-data/
```

## Notes

This kit is now runnable as a standalone starter kit for developers, but it is still not a fully productized plugin.

Extraction status in short:

- the minimal workflow, CLI, analysis path, local task store, and delivery renderer are already inside this repo
- deeper runtime-native orchestration and more productized packaging are still future work
