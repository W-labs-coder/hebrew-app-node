import { EventEmitter } from 'events';

// Simple global event bus for streaming job progress via SSE
class ProgressBus extends EventEmitter {}

export const progressBus = new ProgressBus();

// Helper to emit a structured event
export function emitProgress(event) {
  // event: { type, jobType, jobId, shop, themeId, locale, message, progress, meta }
  progressBus.emit('progress', {
    timestamp: Date.now(),
    ...event,
  });
}

