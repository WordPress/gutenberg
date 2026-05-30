/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { BLOCK_VISIBILITY_VIEWPORT_ENTRIES } from './constants';

/**
 * Checks if a block is hidden for a specific viewport.
 *
 * @param {Object} block    The block to check.
 * @param {string} viewport The viewport to check (e.g., 'mobile', 'tablet', 'desktop').
 * @return {boolean} Whether the block is hidden for the viewport.
 */
function isBlockHiddenForViewport( block, viewport ) {
	if ( ! block ) {
		return false;
	}

	const blockVisibility = block.attributes?.metadata?.blockVisibility;

	// If explicitly visible everywhere (true), return false for all viewports.
	if ( blockVisibility === true ) {
		return false;
	}

	// If null or not an object, block is not hidden for any specific viewport.
	if ( 'object' !== typeof blockVisibility ) {
		return false;
	}

	// Get viewport configuration from nested structure.
	const viewportConfig = blockVisibility.viewport;

	// If no viewport config, block is not hidden for any specific viewport.
	if ( ! viewportConfig || 'object' !== typeof viewportConfig ) {
		return false;
	}

	// Check if the viewport is valid.
	if (
		! BLOCK_VISIBILITY_VIEWPORT_ENTRIES.some(
			( [ , { key } ] ) => key === viewport
		)
	) {
		return false;
	}

	// Check if the specific viewport is hidden.
	return viewportConfig[ viewport ] === false;
}

/**
 * Gets the checkbox state for a viewport across multiple blocks.
 * Returns `true` if all blocks are hidden, `null` if some are hidden, `false` if none are hidden.
 *
 * @param {Array}  blocks   Array of blocks to check.
 * @param {string} viewport The viewport to check (e.g., 'mobile', 'tablet', 'desktop').
 * @return {boolean|null} `true` if all hidden, `null` if some hidden, `false` if none hidden.
 */
export function getViewportCheckboxState( blocks, viewport ) {
	if ( ! blocks?.length ) {
		return false;
	}

	const hiddenCount = blocks.filter( ( block ) =>
		isBlockHiddenForViewport( block, viewport )
	).length;

	if ( hiddenCount === 0 ) {
		return false;
	}
	if ( hiddenCount === blocks.length ) {
		return true;
	}

	return null; // Indeterminate: some hidden, some visible (normal mixed state)
}

/**
 * Gets the checkbox state for "hide everywhere" across multiple blocks.
 * Returns `true` if all blocks are hidden everywhere, `null` if some are hidden everywhere, `false` if none are.
 *
 * @param {Array} blocks Array of blocks to check.
 * @return {boolean|null} `true` if all hidden everywhere, `null` if some hidden everywhere, `false` if none.
 */
export function getHideEverywhereCheckboxState( blocks ) {
	if ( ! blocks?.length ) {
		return false;
	}

	const hiddenEverywhereCount = blocks.filter(
		( block ) =>
			block && block.attributes?.metadata?.blockVisibility === false
	).length;

	if ( hiddenEverywhereCount === 0 ) {
		return false;
	}
	if ( hiddenEverywhereCount === blocks.length ) {
		return true;
	}

	return null; // Indeterminate: some but not all
}

/**
 * Get a human-readable label describing which viewports a block is hidden on.
 *
 * @param {boolean|Object} blockVisibility The block's visibility metadata.
 * @return {string|null} A descriptive label, or null if the block is not hidden.
 */
export function getBlockVisibilityLabel( blockVisibility ) {
	// Not hidden at all
	if ( ! blockVisibility && blockVisibility !== false ) {
		return null;
	}

	if ( blockVisibility === false ) {
		// Hidden on all viewports
		return __( 'Block is hidden' );
	}

	if ( blockVisibility?.viewport ) {
		// Hidden on specific viewports - list them
		const hiddenViewports = BLOCK_VISIBILITY_VIEWPORT_ENTRIES.filter(
			( [ key ] ) => blockVisibility.viewport?.[ key ] === false
		).map( ( [ , viewport ] ) => viewport.label );

		if ( hiddenViewports.length > 0 ) {
			return sprintf(
				/* translators: %s: comma-separated list of viewport names (Desktop, Tablet, Mobile) */
				__( 'Block is hidden on %s' ),
				hiddenViewports.join( ', ' )
			);
		}
	}

	return null;
}
