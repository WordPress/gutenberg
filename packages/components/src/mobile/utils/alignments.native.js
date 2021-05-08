/**
 * WordPress dependencies
 */
import { getBlockType } from '@wordpress/blocks';

export const WIDE_ALIGNMENTS = {
	alignments: {
		wide: 'wide',
		full: 'full',
	},
	// `innerContainers`: Group of blocks based on `InnerBlocks` component,
	// used to nest other blocks inside
	innerContainers: [
		'core/group',
		'core/columns',
		'core/column',
		'core/buttons',
		'core/button',
	],
	excludeBlocks: [ 'core/heading' ],
	notInnerContainers: [
		'core/separator',
		'core/media-text',
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
	const blockType = getBlockType( blockName );
	const blockAlign = blockType?.supports?.align;
	if ( Array.isArray( blockAlign ) && blockAlign.includes( 'full' ) ) {
		return true; // The block support align
	}

	if (
		blockType?.parent?.some( ( parent ) => {
			const blockTypeParent = getBlockType( parent );
			const blockAlignParent = blockTypeParent?.supports?.align;
			return (
				Array.isArray( blockAlignParent ) &&
				blockAlignParent.includes( 'full' )
			);
		} )
	) {
		return true;
	}

	return false;
};

export const alignmentHelpers = {
	isFullWidth,
	isWideWidth,
	isWider,
	isContainerRelated,
};
