/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { addFilter } from '@wordpress/hooks';
import { hasBlockSupport } from '@wordpress/blocks';

/**
 * Add breakpoint visibility classes to block save output.
 *
 * @param {Object} extraProps Additional props applied to save element.
 * @param {Object} blockType  Block type.
 * @param {Object} attributes Current block attributes.
 *
 * @return {Object} Filtered props applied to save element.
 */
function addSaveProps( extraProps, blockType, attributes ) {
	if ( ! hasBlockSupport( blockType, 'visibility', true ) ) {
		return extraProps;
	}

	const breakpointVisibility =
		attributes?.metadata?.blockVisibilityBreakpoints;

	if ( ! breakpointVisibility ) {
		return extraProps;
	}

	extraProps.className = clsx(
		extraProps.className,
		breakpointVisibility.mobile && 'wp-block-hidden-mobile',
		breakpointVisibility.tablet && 'wp-block-hidden-tablet',
		breakpointVisibility.desktop && 'wp-block-hidden-desktop'
	);

	return extraProps;
}

addFilter(
	'blocks.getSaveContent.extraProps',
	'core/block-editor/block-visibility-breakpoints',
	addSaveProps
);
