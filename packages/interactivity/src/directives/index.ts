/**
 * Registers all core Interactivity API directives.
 *
 * Each directive file registers itself via `directive()` at module scope when
 * imported. This module aggregates all of them and exports a single
 * initialization function so that `index.ts` can call it uniformly.
 */

// Import each directive module so it self-registers.
import './bind';
import './class';
import './context';
import './each';
import './ignore';
import './init';
import './on';
import './router-region';
import './run';
import './style';
import './text';
import './watch';

// Re-export so the caller can reference the same singleton.
export { routerRegions } from './router-region';

/**
 * Initializes all core directives.
 *
 * Directives register themselves at import time, so this function is a no-op
 * that exists only to satisfy the calling convention in `index.ts`.
 */
export default function registerDirectives(): void {}
