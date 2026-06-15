/**
 * Internal dependencies
 */
import { default as useCommandContext } from './hooks/use-command-context';
import { lock } from './lock-unlock';

/**
 * @private
 */
export const privateApis = {};
lock( privateApis, {
	useCommandContext,
} );
