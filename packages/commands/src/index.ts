export { CommandMenu } from './components/command-menu';
export { privateApis } from './private-apis';
export { useCommand, useCommands } from './hooks/use-command';
export { default as useCommandLoader } from './hooks/use-command-loader';
export { store } from './store';

/**
 * The category of a command: `command`, `view`, `edit`, `action` or `workflow`.
 */
export type { CommandCategory } from './store/types';

/**
 * Configuration of a command registered with `useCommand` or `useCommands`.
 */
export type { CommandConfig } from './store/types';

/**
 * Configuration of a command loader registered with `useCommandLoader`.
 */
export type { CommandLoaderConfig } from './store/types';

/**
 * A hook that receives the search term and returns the matching commands and
 * whether they are still loading.
 */
export type { CommandLoaderHook } from './store/types';
