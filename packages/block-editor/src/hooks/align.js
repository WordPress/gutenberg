/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { addFilter } from '@wordpress/hooks';
import {
	getBlockSupport,
	getBlockType,
	hasBlockSupport,
} from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { BlockControls, BlockAlignmentControl } from '../components';
import useAvailableAlignments from '../components/block-alignment-control/use-available-alignments';
import { useBlockEditingMode } from '../components/block-editing-mode';

/**
 * An array which includes all possible valid alignments,
 * used to validate if an alignment is valid or not.
 *
 * @constant
 * @type {string[]}
 */
const ALL_ALIGNMENTS = [ 'left', 'center', 'right', 'wide', 'full' ];

/**
 * An array which includes all wide alignments.
 * In order for this alignments to be valid they need to be supported by the block,
 * and by the theme.
 *
 * @constant
 * @type {string[]}
 */
const WIDE_ALIGNMENTS = [ 'wide', 'full' ];

/**
 * Returns the valid alignments.
 * Takes into consideration the aligns supported by a block, if the block supports wide controls or not and if theme supports wide controls or not.
 * Exported just for testing purposes, not exported outside the module.
 *
 * @param {?boolean|string[]} blockAlign          Aligns supported by the block.
 * @param {?boolean}          hasWideBlockSupport True if block supports wide alignments. And False otherwise.
 * @param {?boolean}          hasWideEnabled      True if theme supports wide alignments. And False otherwise.
 *
 * @return {string[]} Valid alignments.
 */
export function getValidAlignments(
	blockAlign,
	hasWideBlockSupport = true,
	hasWideEnabled = true
) {
	let validAlignments;
	if ( Array.isArray( blockAlign ) ) {
		validAlignments = ALL_ALIGNMENTS.filter( ( value ) =>
			blockAlign.includes( value )
		);
	} else if ( blockAlign === true ) {
		// `true` includes all alignments...
		validAlignments = [ ...ALL_ALIGNMENTS ];
	} else {
		validAlignments = [];
	}

	if (
		! hasWideEnabled ||
		( blockAlign === true && ! hasWideBlockSupport )
	) {
		return validAlignments.filter(
			( alignment ) => ! WIDE_ALIGNMENTS.includes( alignment )
		);
	}

	return validAlignments;
}

/**
 * Filters registered block settings, extending attributes to include `align`.
 *
 * @param {Object} settings Original block settings.
 *
 * @return {Object} Filtered block settings.
 */
export function addAttribute( settings ) {
	// Allow blocks to specify their own attribute definition with default values if needed.
	if ( 'type' in ( settings.attributes?.align ?? {} ) ) {
		return settings;
	}
	if ( hasBlockSupport( settings, 'align' ) ) {
		// Gracefully handle if settings.attributes is undefined.
		settings.attributes = {
			...settings.attributes,
			align: {
				type: 'string',
				// Allow for '' since it is used by the `updateAlignment` function
				// in toolbar controls for special cases with defined default values.
				enum: [ ...ALL_ALIGNMENTS, '' ],
			},
		};
	}

	return settings;
}

function BlockEditAlignmentToolbarControlsPure( {
	name: blockName,
	align,
	setAttributes,
} ) {
	// Compute the block valid alignments by taking into account,
	// if the theme supports wide alignments or not and the layout's
	// available alignments. We do that for conditionally rendering
	// Slot.
	const blockAllowedAlignments = getValidAlignments(
		getBlockSupport( blockName, 'align' ),
		hasBlockSupport( blockName, 'alignWide', true )
	);

	const validAlignments = useAvailableAlignments(
		blockAllowedAlignments
	).map( ( { name } ) => name );
	const blockEditingMode = useBlockEditingMode();
	if ( ! validAlignments.length || blockEditingMode !== 'default' ) {
		return null;
	}

	const updateAlignment = ( nextAlign ) => {
		if ( ! nextAlign ) {
			const blockType = getBlockType( blockName );
			const blockDefaultAlign = blockType?.attributes?.align?.default;
			if ( blockDefaultAlign ) {
				nextAlign = '';
			}
		}
		setAttributes( { align: nextAlign } );
	};

	return (
		<BlockControls group="block" __experimentalShareWithChildBlocks>
			<BlockAlignmentControl
				value={ align }
				onChange={ updateAlignment }
				controls={ validAlignments }
			/>
		</BlockControls>
	);
}

export default {
	shareWithChildBlocks: true,
	edit: BlockEditAlignmentToolbarControlsPure,
	useBlockProps,
	addSaveProps: addAssignedAlign,
	attributeKeys: [ 'align' ],
	hasSupport( name ) {
		return hasBlockSupport( name, 'align', false );
	},
};

function useBlockProps( { name, align } ) {
	const blockAllowedAlignments = getValidAlignments(
		getBlockSupport( name, 'align' ),
		hasBlockSupport( name, 'alignWide', true )
	);
	const validAlignments = useAvailableAlignments( blockAllowedAlignments );

	if ( validAlignments.some( ( alignment ) => alignment.name === align ) ) {
		return { 'data-align': align };
	}

	return {};
}

/**
 * Override props assigned to save component to inject alignment class name if
 * block supports it.
 *
 * @param {Object} props      Additional props applied to save element.
 * @param {Object} blockType  Block type.
 * @param {Object} attributes Block attributes.
 *
 * @return {Object} Filtered props applied to save element.
 */
export function addAssignedAlign( props, blockType, attributes ) {
	const { align } = attributes;
	const blockAlign = getBlockSupport( blockType, 'align' );
	const hasWideBlockSupport = hasBlockSupport( blockType, 'alignWide', true );

	// Compute valid alignments without taking into account if
	// the theme supports wide alignments or not.
	// This way changing themes does not impact the block save.
	const isAlignValid = getValidAlignments(
		blockAlign,
		hasWideBlockSupport
	).includes( align );
	if ( isAlignValid ) {
		props.className = clsx( `align${ align }`, props.className );
	}

	return props;
}

addFilter(
	'blocks.registerBlockType',
	'core/editor/align/addAttribute',
	addAttribute
);
