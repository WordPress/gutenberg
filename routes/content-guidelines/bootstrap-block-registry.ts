/**
 * WordPress dependencies
 */
import { dispatch } from '@wordpress/data';
import { store as blocksStore } from '@wordpress/blocks';
import { registerCoreBlocks } from '@wordpress/block-library';

let bootstrapped = false;

/**
 * Bootstraps the block registry with Core blocks only.
 * Used on the Content Guidelines admin page so block icons (and later
 * 3rd party/experimental block support) are available without loading
 * the full block editor.
 */
export function bootstrapBlockRegistry(): void {
	if ( bootstrapped ) {
		return;
	}
	bootstrapped = true;

	dispatch( blocksStore ).reapplyBlockTypeFilters();
	registerCoreBlocks();
}
