/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { getBlockSupport, hasBlockSupport } from '@wordpress/blocks';
import { alignLeft, alignRight, alignCenter } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { AlignmentControl, BlockControls } from '../components';
import { useBlockEditingMode } from '../components/block-editing-mode';
import { cleanEmptyObject, shouldSkipSerialization } from './utils';
import { TYPOGRAPHY_SUPPORT_KEY } from './typography';

export const TEXT_ALIGN_SUPPORT_KEY = 'typography.textAlign';

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

function BlockEditTextAlignmentToolbarControlsPure( {
	style,
	name: blockName,
	setAttributes,
} ) {
	const validTextAlignments = getValidTextAlignments(
		getBlockSupport( blockName, TEXT_ALIGN_SUPPORT_KEY )
	);
	const blockEditingMode = useBlockEditingMode();
	if ( ! validTextAlignments.length || blockEditingMode !== 'default' ) {
		return null;
	}

	const textAlignmentControls = TEXT_ALIGNMENT_OPTIONS.filter( ( control ) =>
		validTextAlignments.includes( control.align )
	);

	const onChange = ( newTextAlignValue ) => {
		const newStyle = {
			...style,
			typography: {
				...style?.typography,
				textAlign: newTextAlignValue,
			},
		};

		setAttributes( { style: cleanEmptyObject( newStyle ) } );
	};

	return (
		<BlockControls group="block">
			<AlignmentControl
				value={ style?.typography?.textAlign }
				onChange={ onChange }
				alignmentControls={ textAlignmentControls }
			/>
		</BlockControls>
	);
}

export default {
	edit: BlockEditTextAlignmentToolbarControlsPure,
	useBlockProps,
	addSaveProps: addAssignedTextAlign,
	attributeKeys: [ 'style' ],
	hasSupport( name ) {
		return hasBlockSupport( name, TEXT_ALIGN_SUPPORT_KEY, false );
	},
};

function useBlockProps( { name, style } ) {
	if ( ! style?.typography?.textAlign ) {
		return null;
	}

	const validTextAlignments = getValidTextAlignments(
		getBlockSupport( name, TEXT_ALIGN_SUPPORT_KEY )
	);

	if ( ! validTextAlignments.length ) {
		return null;
	}

	if (
		shouldSkipSerialization( name, TYPOGRAPHY_SUPPORT_KEY, 'textAlign' )
	) {
		return null;
	}

	const textAlign = style.typography.textAlign;

	const className = clsx( {
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
	if ( ! attributes?.style?.typography?.textAlign ) {
		return props;
	}

	const { textAlign } = attributes.style.typography;
	const blockTextAlign = getBlockSupport( blockType, TEXT_ALIGN_SUPPORT_KEY );
	const isTextAlignValid =
		getValidTextAlignments( blockTextAlign ).includes( textAlign );
	if (
		isTextAlignValid &&
		! shouldSkipSerialization(
			blockType,
			TYPOGRAPHY_SUPPORT_KEY,
			'textAlign'
		)
	) {
		props.className = clsx(
			`has-text-align-${ textAlign }`,
			props.className
		);
	}
	return props;
}
