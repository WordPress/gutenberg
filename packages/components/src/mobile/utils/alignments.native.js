/**
 * WordPress dependencies
 */
import { getBlockType } from '@wordpress/blocks';

export const WIDE_ALIGNMENTS = {
	alignments: {
		wide: 'wide',
		full: 'full',
	},
	excludeBlocks: [ 'core/heading' ],
	notInnerContainers: [
		'core/image',
		'core/separator',
		'core/media-text',
		'core/quote',
		'core/pullquote',
	],
};

export const ALIGNMENT_BREAKPOINTS = {
	wide: 1024,
	large: 820,
	medium: 768,
	small: 680,
	mobile: 480,
};

const isFullWidth = ( align ) => align === WIDE_ALIGNMENTS.alignments.full;

const isWideWidth = ( align ) => align === WIDE_ALIGNMENTS.alignments.wide;

const isWider = ( width, breakpoint ) =>
	width > ALIGNMENT_BREAKPOINTS[ breakpoint ];

const isContainerRelated = ( blockName ) => {
	if ( WIDE_ALIGNMENTS.notInnerContainers.includes( blockName ) ) {
		return false;
	}

	if ( hasFullWidthSupport( blockName ) ) {
		return true;
	}

	return hasParentFullWidthSupport( blockName );
};

/**
 * Whether the block has support for full width alignment.
 *
 * @param {string} blockName
 * @return {boolean} Return whether the block supports full width alignment.
 */
function hasFullWidthSupport( blockName ) {
	const blockType = getBlockType( blockName );
	const blockAlign = blockType?.supports?.align;
	return (
		!! Array.isArray( blockAlign ) &&
		blockAlign.includes( WIDE_ALIGNMENTS.alignments.full )
	);
}
/**
 * Whether the block's parent has support for full width alignment.
 *
 * @param {string} blockName
 * @return {boolean} Return whether the block's parent supports full width alignment.
 */
function hasParentFullWidthSupport( blockName ) {
	const blockType = getBlockType( blockName );
	return !! blockType?.parent?.some( hasFullWidthSupport );
}

export const alignmentHelpers = {
	isFullWidth,
	isWideWidth,
	isWider,
	isContainerRelated,
};
