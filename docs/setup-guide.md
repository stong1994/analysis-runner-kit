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

## 4. Go to the project directory

```bash
cd openclaw-control-center
```

## 5. Run the workflow

Example:

```bash
lobster run lobster/analysis-runner.lobster --args-json '{"request":"分析这个项目 https://github.com/affaan-m/everything-claude-code"}'
```

## 6. Read the result

Get the latest task:

```bash
node --import tsx src/lobster/cli.ts list
```

Render the delivery:

```bash
node --import tsx src/lobster/delivery-cli.ts <taskId>
```

## Notes

This kit is currently shareable for developers, not yet fully standalone for end users.
