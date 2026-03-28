import { ingestRepositoryFromText } from './repo-ingest';

export interface RepoAnalysisSummary {
  url: string;
  repo?: string;
  readmeSnippet?: string;
  packageName?: string;
  packageVersion?: string;
  packageDescription?: string;
  archetype?: string;
  topLevelEntries?: string[];
  keyFiles?: string[];
  entrypoints?: { path: string; snippet: string }[];
  confidence: '高' | '中' | '低';
  summary: string;
  reviewNotes: string;
  mainSummary: string;
}

export function buildRepoAnalysisFromText(input: string): RepoAnalysisSummary | undefined {
  const repo = ingestRepositoryFromText(input);
  if (!repo) {
    return undefined;
  }

  const confidence = computeConfidence(repo);
  const whatItIs = buildWhatItIs(repo);
  const problem = buildProblem(repo);
  const maturity = buildMaturity(repo);
  const strengths = buildStrengths(repo);
  const risks = buildRisks(repo);
  const fit = buildFit(repo);
  const judgment = buildJudgment(repo);

  const summary = [
    `项目： ${repo.repo ?? repo.url}`,
    `类型： ${repo.archetype}`,
    `置信度： ${confidence}`,
    whatItIs ? `它是什么： ${whatItIs}` : undefined,
    problem ? `它解决的问题： ${problem}` : undefined,
    maturity ? `成熟度： ${maturity}` : undefined,
    strengths.length ? `优点： ${strengths.join('；')}` : undefined,
    risks.length ? `风险： ${risks.join('；')}` : undefined,
    fit ? `适合场景： ${fit}` : undefined,
    judgment ? `结论： ${judgment}` : undefined,
    repo.topLevelEntries?.length ? `顶层结构： ${repo.topLevelEntries.slice(0, 12).join(', ')}` : undefined,
    repo.keyFiles?.length ? `关键文件： ${repo.keyFiles.join(', ')}` : undefined,
    repo.entrypoints?.length
      ? `入口样本： ${repo.entrypoints.map((item) => `${item.path} => ${item.snippet}`).join(' | ')}`
      : undefined,
    repo.readmeSnippet ? `证据片段： ${repo.readmeSnippet}` : undefined,
  ]
    .filter(Boolean)
    .join('\n');

  return {
    url: repo.url,
    repo: repo.repo,
    readmeSnippet: repo.readmeSnippet,
    packageName: repo.packageName,
    packageVersion: repo.packageVersion,
    packageDescription: repo.packageDescription,
    archetype: repo.archetype,
    topLevelEntries: repo.topLevelEntries,
    keyFiles: repo.keyFiles,
    entrypoints: repo.entrypoints,
    confidence,
    summary,
    reviewNotes:
      '审查意见：这轮 first-pass 分析已经基于仓库克隆、目录结构、关键文件、README/package 元数据、类型判断和少量入口样本，但更强的架构结论仍然需要继续读更深层源码。',
    mainSummary: repo.repo
      ? `主摘要：已克隆 ${repo.repo}，将其识别为 ${repo.archetype}，并基于关键入口样本生成了结构化 first-pass 分析。`
      : `主摘要：已克隆该仓库，完成类型识别与关键入口采样，并生成了结构化 first-pass 分析。`,
  };
}

function computeConfidence(repo: ReturnType<typeof ingestRepositoryFromText>): '高' | '中' | '低' {
  if (!repo) {
    return '低';
  }
  const hasReadme = Boolean(repo.readmeSnippet);
  const hasPackage = Boolean(repo.packageName);
  const hasEntrypoints = repo.entrypoints.length > 0;
  if (hasReadme && hasPackage && hasEntrypoints) {
    return '高';
  }
  if ((hasReadme && hasEntrypoints) || (hasReadme && hasPackage)) {
    return '中';
  }
  return '低';
}

function buildWhatItIs(repo: ReturnType<typeof ingestRepositoryFromText>): string | undefined {
  if (!repo) {
    return undefined;
  }
  if (repo.packageDescription) {
    return repo.packageDescription;
  }
  if (repo.archetype === 'config-pack') {
    return '一个可复用的配置与工作流资产包，而不是面向终端用户的独立应用。';
  }
  if (repo.archetype === 'tooling') {
    return '一个面向开发工作流或自动化支持的工具型项目。';
  }
  if (repo.archetype === 'library') {
    return '一个倾向于被其他系统嵌入或复用的库型项目。';
  }
  return undefined;
}

function buildProblem(repo: ReturnType<typeof ingestRepositoryFromText>): string | undefined {
  if (!repo) {
    return undefined;
  }
  if (repo.archetype === 'config-pack') {
    return '帮助高级用户避免从零重建 prompts、hooks、agent 布局和命令约定。';
  }
  if (repo.archetype === 'tooling') {
    return '尝试提升开发工作流的效率、一致性或自动化程度。';
  }
  if (repo.archetype === 'library') {
    return '为其他代码库提供可复用能力，而不是单独交付完整产品。';
  }
  if (repo.archetype === 'app') {
    return '看起来提供了一个可运行的应用或服务，并带有终端用户工作流。';
  }
  return undefined;
}

function buildMaturity(repo: ReturnType<typeof ingestRepositoryFromText>): string | undefined {
  if (!repo) {
    return undefined;
  }
  const hasTests = repo.keyFiles.includes('tests') || repo.keyFiles.includes('test');
  const hasDocs = repo.keyFiles.includes('docs');
  const hasPackage = Boolean(repo.packageName);
  if (hasTests && hasDocs && hasPackage) {
    return '从 package 元数据、文档和测试面来看，这个仓库已经不像一次性 demo，更接近持续维护中的开源项目。';
  }
  if (hasDocs || hasPackage) {
    return '已经超过随手 demo 的状态，但成熟度仍然取决于更深层代码检查。';
  }
  return '仅凭当前仓库结构还不足以证明成熟度。';
}

function buildStrengths(repo: ReturnType<typeof ingestRepositoryFromText>): string[] {
  if (!repo) {
    return [];
  }
  const strengths: string[] = [];
  if (repo.archetype === 'config-pack') {
    strengths.push('仓库明显围绕可复用工作流与配置资产组织，定位清晰');
  }
  if (repo.keyFiles.includes('docs')) {
    strengths.push('存在文档，利于上手和知识迁移');
  }
  if (repo.keyFiles.includes('tests') || repo.keyFiles.includes('test')) {
    strengths.push('存在测试，说明至少有一定维护纪律');
  }
  if (repo.packageDescription) {
    strengths.push('package 元数据对项目范围与意图描述清楚');
  }
  if (repo.entrypoints.length > 0) {
    strengths.push('已经拿到第一批代码/配置入口样本，可支持浅层架构判断');
  }
  return strengths;
}

function buildRisks(repo: ReturnType<typeof ingestRepositoryFromText>): string[] {
  if (!repo) {
    return [];
  }
  const risks: string[] = [];
  if (repo.archetype === 'config-pack') {
    risks.push('价值可能高度依赖特定工具生态与用户工作流习惯');
  }
  if (!repo.keyFiles.includes('tests') && !repo.keyFiles.includes('test')) {
    risks.push('从仓库根扫描看不到明显测试面');
  }
  if (repo.entrypoints.length === 0) {
    risks.push('还没有捕获入口样本，因此架构判断必须保守');
  } else {
    risks.push('当前分析仍只基于很少量入口样本，可能遗漏更深层模块复杂度');
  }
  return risks;
}

function buildFit(repo: ReturnType<typeof ingestRepositoryFromText>): string | undefined {
  if (!repo) {
    return undefined;
  }
  if (repo.archetype === 'config-pack') {
    return '更适合想要一套成熟操作包的高级用户，而不是普通终端用户。';
  }
  if (repo.archetype === 'tooling') {
    return '更适合重视工作流效率和自动化增益的开发者。';
  }
  if (repo.archetype === 'library') {
    return '更适合需要集成复用能力的团队，而不是直接找成品应用的人。';
  }
  return undefined;
}

function buildJudgment(repo: ReturnType<typeof ingestRepositoryFromText>): string | undefined {
  if (!repo) {
    return undefined;
  }
  if (repo.archetype === 'config-pack') {
    return '这更像一个面向 Claude Code 生态的高质量操作系统式资产包，而不是传统软件产品；如果你的目标是工作流杠杆，它是有价值的。';
  }
  if (repo.archetype === 'tooling') {
    return '如果你更看重工作流效率而不是终端用户产品体验，这类项目是值得看的。';
  }
  if (repo.archetype === 'library') {
    return '这类项目更值得从 API 形状、集成成本和复用价值角度评估，而不是按产品 UX 看。';
  }
  return '这个仓库已经有足够证据支持 grounded first-pass，但还不足以下特别深的架构结论。';
}
