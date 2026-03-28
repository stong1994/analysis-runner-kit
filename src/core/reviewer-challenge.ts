import type { RepoAnalysisSummary } from './repo-analysis';

export function buildReviewerChallenge(summary: RepoAnalysisSummary | undefined): string {
  if (!summary) {
    return '审查意见：当前没有足够的仓库证据，整体置信度偏低，所有结论都应视为临时判断。';
  }

  const findings: string[] = [];

  if (!summary.readmeSnippet) {
    findings.push('缺少 README 证据，项目意图可能被误读');
  }

  if (!summary.entrypoints?.length) {
    findings.push('还没有采样代码或配置入口，因此架构判断需要保持保守');
  }

  if (summary.confidence !== '高') {
    findings.push(`当前置信度为${summary.confidence}，因此仍应视作 first-pass 判断`);
  }

  if (!summary.topLevelEntries?.includes('tests') && !summary.topLevelEntries?.includes('test')) {
    findings.push('从仓库根目录看不到明显测试面');
  }

  if (summary.archetype === 'config-pack') {
    findings.push('这个项目生态绑定较强，脱离 Claude Code 风格工作流后的迁移性可能有限');
  }

  if (findings.length === 0) {
    findings.push('这轮 first-pass 已经有较强证据支撑，但在下更强架构结论前仍然建议继续扩展代码阅读面');
  }

  return `审查意见：${findings.join('；')}。`;
}
