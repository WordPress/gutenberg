/**
 * Internal dependencies
 */
import { default as BlockKeyboardShortcuts } from './block-keyboard-shortcuts';
import { NAVIGATION_OVERLAY_TEMPLATE_PART_AREA } from './navigation/constants';
import { registerPHPOnlyBlocks } from './utils/register-php-only-blocks';
import { lock } from './lock-unlock';

/**
 * @private
 */
export const privateApis = {};
lock( privateApis, {
	BlockKeyboardShortcuts,
	NAVIGATION_OVERLAY_TEMPLATE_PART_AREA,
	registerPHPOnlyBlocks,
} );
