import { default as useCommandContext } from './hooks/use-command-context';
import { lock } from './lock-unlock';
import { CommandsDisabledContext } from './commands-disabled-context';

/**
 * @private
 */
export const privateApis = {};
lock( privateApis, {
	useCommandContext,
	CommandsDisabledContext,
} );
