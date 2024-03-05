/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { addFilter } from '@wordpress/hooks';
import {
	getBlockSupport,
	getBlockType,
	hasBlockSupport,
} from '@wordpress/blocks';
import { alignLeft, alignRight, alignCenter } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { AlignmentControl, BlockControls } from '../components';
import { useBlockEditingMode } from '../components/block-editing-mode';

const TEXT_ALIGNMENT_OPTIONS = [
	{
		icon: alignLeft,
		title: __( 'Align text left' ),
		align: 'left',
	},
	{
		icon: alignCenter,
		title: __( 'Align text center' ),
		align: 'center',
	},
	{
		icon: alignRight,
		title: __( 'Align text right' ),
		align: 'right',
	},
];

const VALID_TEXT_ALIGNMENTS = [ 'left', 'center', 'right' ];

/**
 * Returns the valid text alignments.
 * Takes into consideration the text aligns supported by a block.
 * Exported just for testing purposes, not exported outside the module.
 *
 * @param {?boolean|string[]} blockTextAlign Text aligns supported by the block.
 *
 * @return {string[]} Valid text alignments.
 */
export function getValidTextAlignments( blockTextAlign ) {
	let validTextAlignments;
	if ( Array.isArray( blockTextAlign ) ) {
		validTextAlignments = VALID_TEXT_ALIGNMENTS.filter( ( textAlign ) =>
			blockTextAlign.includes( textAlign )
		);
	} else if ( blockTextAlign === true ) {
		// `true` includes all alignments...
		validTextAlignments = [ ...VALID_TEXT_ALIGNMENTS ];
	} else {
		validTextAlignments = [];
	}

	return validTextAlignments;
}

/**
 * Filters registered block settings, extending attributes to include `textAlign`.
 *
 * @param {Object} settings Original block settings.
 *
 * @return {Object} Filtered block settings.
 */
export function addAttribute( settings ) {
	// Allow blocks to specify their own attribute definition with default values if needed.
	if ( 'type' in ( settings.attributes?.textAlign ?? {} ) ) {
		return settings;
	}
	if ( hasBlockSupport( settings, 'textAlign' ) ) {
		// Gracefully handle if settings.attributes is undefined.
		settings.attributes = {
			...settings.attributes,
			textAlign: {
				type: 'string',
				// Allow for '' since it is used by the `updateTextAlignment` function
				// in toolbar controls for special cases with defined default values.
				enum: [ ...VALID_TEXT_ALIGNMENTS, '' ],
			},
		};
	}

	return settings;
}

function BlockEditTextAlignmentToolbarControlsPure( {
	name: blockName,
	textAlign,
	setAttributes,
} ) {
	const validTextAlignments = getValidTextAlignments(
		getBlockSupport( blockName, 'textAlign' )
	);
	const blockEditingMode = useBlockEditingMode();
	if ( ! validTextAlignments.length || blockEditingMode !== 'default' ) {
		return null;
	}

	const textAlignmentControls = TEXT_ALIGNMENT_OPTIONS.filter( ( control ) =>
		validTextAlignments.includes( control.align )
	);

	const updateTextAlignment = ( nextTextAlign ) => {
		if ( ! nextTextAlign ) {
			const blockType = getBlockType( blockName );
			const blockDefaultTextAlign =
				blockType?.attributes?.textAlign?.default;
			if ( blockDefaultTextAlign ) {
				nextTextAlign = '';
			}
		}
		setAttributes( { textAlign: nextTextAlign } );
	};

	return (
		<BlockControls group="block">
			<AlignmentControl
				value={ textAlign }
				onChange={ updateTextAlignment }
				alignmentControls={ textAlignmentControls }
			/>
		</BlockControls>
	);
}

export default {
	edit: BlockEditTextAlignmentToolbarControlsPure,
	useBlockProps,
	addSaveProps: addAssignedTextAlign,
	attributeKeys: [ 'textAlign' ],
	hasSupport( name ) {
		return hasBlockSupport( name, 'textAlign', false );
	},
};

function useBlockProps( { name, textAlign } ) {
	const validTextAlignments = getValidTextAlignments(
		getBlockSupport( name, 'textAlign' )
	);
	if ( ! validTextAlignments.length ) {
		return null;
	}
	const className = classnames( {
		[ `has-text-align-${ textAlign }` ]: textAlign,
	} );
	return { className };
}

/**
 * Override props assigned to save component to inject text alignment class
 * name if block supports it.
 *
 * @param {Object} props      Additional props applied to save element.
 * @param {Object} blockType  Block type.
 * @param {Object} attributes Block attributes.
 *
 * @return {Object} Filtered props applied to save element.
 */
export function addAssignedTextAlign( props, blockType, attributes ) {
	const { textAlign } = attributes;
	const blockTextAlign = getBlockSupport( blockType, 'textAlign' );
	const isTextAlignValid =
		getValidTextAlignments( blockTextAlign ).includes( textAlign );
	if ( isTextAlignValid ) {
		props.className = classnames(
			`has-text-align-${ textAlign }`,
			props.className
		);
	}
	return props;
}

addFilter(
	'blocks.registerBlockType',
	'core/editor/align/addAttribute',
	addAttribute
);
