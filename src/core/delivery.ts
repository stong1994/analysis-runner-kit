import { readTask } from './store';

export function buildDeliveredTaskSummary(taskId: string): string {
  const task = readTask(taskId);
  const analysisDraft = task.artifacts.find((item) => item.label === 'analysis-draft')?.value ?? '';
  const reviewNotes = task.artifacts.find((item) => item.label === 'review-notes')?.value ?? '';
  const mainSummary = task.artifacts.find((item) => item.label === 'main-summary')?.value ?? '';

  const lines = analysisDraft
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

  const conclusionPrefixes = ['项目：', '类型：', '置信度：', '它是什么：', '结论：'];
  const conclusionLines = lines.filter((line) => conclusionPrefixes.some((prefix) => line.startsWith(prefix)));
  const detailLines = lines.filter((line) => !conclusionLines.includes(line));

  return [
    `**分析完成**`,
    `- 任务: ${task.id}`,
    `- 标题: ${task.title}`,
    `- 状态: ${task.status}`,
    mainSummary ? `- 摘要: ${flatten(mainSummary)}` : undefined,
    '',
    `**可复制结论**`,
    '```text',
    conclusionLines.join('\n') || '暂无结论。',
    '```',
    '',
    `**详细证据**`,
    ...detailLines.map((line) => `- ${line}`),
    reviewNotes ? '' : undefined,
    reviewNotes ? `**审查意见**` : undefined,
    reviewNotes ? `- ${flatten(reviewNotes)}` : undefined,
  ]
    .filter((value) => value !== undefined)
    .join('\n');
}

function flatten(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}
