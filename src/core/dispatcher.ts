import { addProgress } from './store';

export interface DispatchStepResult {
  actor: string;
  mode: 'simulated-main-proxy' | 'direct-agent';
  message: string;
}

export function dispatchToSpecialist(taskId: string, actor: string, instruction: string): DispatchStepResult {
  const mode: DispatchStepResult['mode'] = 'simulated-main-proxy';
  addProgress(taskId, `[dispatch:${actor}] ${instruction}`);
  return {
    actor,
    mode,
    message: `Dispatched to ${actor} via ${mode}`,
  };
}
