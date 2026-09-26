import { privateApis as globalStylesEnginePrivateApis } from '@wordpress/global-styles-engine';
import { __, _x, sprintf } from '@wordpress/i18n';
import {
	BLOCK_VISIBILITY_VIEWPORT_ENTRIES,
	BLOCK_VISIBILITY_VIEWPORTS,
} from './constants';
import { unlock } from '../../lock-unlock';

const { getViewportBreakpoints } = unlock( globalStylesEnginePrivateApis );

export function getBlockVisibilityViewportEntries( viewportSettings ) {
	const breakpoints = getViewportBreakpoints( viewportSettings );

	// Desktop has no breakpoint, so only filter mobile/tablet by configured viewport support.
	return BLOCK_VISIBILITY_VIEWPORT_ENTRIES.filter(
		( [ viewport ] ) =>
			( viewport !== BLOCK_VISIBILITY_VIEWPORTS.tablet.key ||
				breakpoints.tablet !== undefined ) &&
			( viewport !== BLOCK_VISIBILITY_VIEWPORTS.mobile.key ||
				breakpoints.mobile !== undefined )
	);
}

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
 * Returns a short reason describing why a block is hidden, or null when no
 * rule hides it: "Omitted from published content" when hidden everywhere, or
 * "Hidden on mobile and tablet" listing the configured viewports it is hidden
 * on. The same string is used by the block toolbar, List View and the
 * accessible name of ghosted blocks. New hiding conditions (for example date
 * or role based visibility) should be added here so every consumer picks them
 * up.
 *
 * @param {boolean|Object} blockVisibility  The block's visibility metadata.
 * @param {Object}         viewportSettings Viewport breakpoint settings.
 * @return {string|null} The reason, or null.
 */
export function getBlockVisibilityReason( blockVisibility, viewportSettings ) {
	if ( blockVisibility === false ) {
		return __( 'Omitted from published content' );
	}

	if (
		typeof blockVisibility?.viewport !== 'object' ||
		blockVisibility.viewport === null
	) {
		return null;
	}

	const viewportNames = {
		desktop: _x( 'desktop', 'viewport name in a sentence' ),
		tablet: _x( 'tablet', 'viewport name in a sentence' ),
		mobile: _x( 'mobile', 'viewport name in a sentence' ),
	};
	const hiddenViewports = getBlockVisibilityViewportEntries(
		viewportSettings
	)
		.filter( ( [ key ] ) => blockVisibility.viewport[ key ] === false )
		.map( ( [ key ] ) => viewportNames[ key ] );

	switch ( hiddenViewports.length ) {
		case 0:
			return null;
		case 1:
			return sprintf(
				/* translators: %s: viewport name, e.g. mobile. */
				__( 'Hidden on %s' ),
				hiddenViewports[ 0 ]
			);
		case 2:
			return sprintf(
				/* translators: 1: viewport name, e.g. tablet. 2: viewport name, e.g. mobile. */
				__( 'Hidden on %1$s and %2$s' ),
				hiddenViewports[ 0 ],
				hiddenViewports[ 1 ]
			);
		default:
			return sprintf(
				/* translators: 1: viewport name, e.g. desktop. 2: viewport name, e.g. tablet. 3: viewport name, e.g. mobile. */
				__( 'Hidden on %1$s, %2$s and %3$s' ),
				hiddenViewports[ 0 ],
				hiddenViewports[ 1 ],
				hiddenViewports[ 2 ]
			);
	}
}

/**
 * Appends a hiding reason to an accessible block label as a new sentence,
 * for example "Block: Column (1 of 2). Hidden on mobile".
 *
 * @param {string|undefined} label  The block's accessible label.
 * @param {string|null}      reason The reason from getBlockVisibilityReason.
 * @return {string|undefined} The combined label.
 */
export function appendVisibilityReason( label, reason ) {
	if ( ! reason ) {
		return label;
	}
	if ( ! label ) {
		return reason;
	}
	return sprintf(
		/* translators: 1: Accessible block label, e.g. "Block: Paragraph". 2: Reason the block is hidden, e.g. "Hidden on mobile". */
		__( '%1$s. %2$s' ),
		// Drop a sentence terminator the label already ends with so the
		// template's full stop is not doubled.
		label.replace( /[.!?]+$/, '' ),
		reason
	);
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
