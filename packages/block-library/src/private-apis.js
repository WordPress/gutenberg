/**
 * Internal dependencies
 */
import { default as BlockKeyboardShortcuts } from './block-keyboard-shortcuts';
import { lock } from './lock-unlock';

/**
 * @private
 */
export const privateApis = {};
lock( privateApis, {
	BlockKeyboardShortcuts,
} );
