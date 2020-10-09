/**
 * External dependencies
 */
import classnames from 'classnames';
import { has, without } from 'lodash';

/**
 * WordPress dependencies
 */
import { createContext, useContext } from '@wordpress/element';
import { createHigherOrderComponent } from '@wordpress/compose';
import { addFilter } from '@wordpress/hooks';
import {
	getBlockSupport,
	getBlockType,
	hasBlockSupport,
} from '@wordpress/blocks';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { BlockControls, BlockAlignmentToolbar } from '../components';

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
		validAlignments = blockAlign;
	} else if ( blockAlign === true ) {
		// `true` includes all alignments...
		validAlignments = ALL_ALIGNMENTS;
	} else {
		validAlignments = [];
	}

	if (
		! hasWideEnabled ||
		( blockAlign === true && ! hasWideBlockSupport )
	) {
		return without( validAlignments, ...WIDE_ALIGNMENTS );
	}

	return validAlignments;
}

/**
 * Filters registered block settings, extending attributes to include `align`.
 *
 * @param  {Object} settings Original block settings
 * @return {Object}          Filtered block settings
 */
export function addAttribute( settings ) {
	// allow blocks to specify their own attribute definition with default values if needed.
	if ( has( settings.attributes, [ 'align', 'type' ] ) ) {
		return settings;
	}
	if ( hasBlockSupport( settings, 'align' ) ) {
		// Gracefully handle if settings.attributes is undefined.
		settings.attributes = {
			...settings.attributes,
			align: {
				type: 'string',
				// Allow for '' since it is used by updateAlignment function
				// in withToolbarControls for special cases with defined default values.
				enum: [ ...ALL_ALIGNMENTS, '' ],
			},
		};
	}

	return settings;
}

const AlignmentHookSettings = createContext( {} );

/**
 * Allows to pass additional settings to the alignment hook.
 */
export const AlignmentHookSettingsProvider = AlignmentHookSettings.Provider;

/**
 * Override the default edit UI to include new toolbar controls for block
 * alignment, if block defines support.
 *
 * @param  {Function} BlockEdit Original component
 * @return {Function}           Wrapped component
 */
export const withToolbarControls = createHigherOrderComponent(
	( BlockEdit ) => ( props ) => {
		const { isEmbedButton } = useContext( AlignmentHookSettings );
		const { name: blockName } = props;
		// Compute valid alignments without taking into account,
		// if the theme supports wide alignments or not.
		// BlockAlignmentToolbar takes into account the theme support.
		const validAlignments = isEmbedButton
			? []
			: getValidAlignments(
					getBlockSupport( blockName, 'align' ),
					hasBlockSupport( blockName, 'alignWide', true )
			  );

		const updateAlignment = ( nextAlign ) => {
			if ( ! nextAlign ) {
				const blockType = getBlockType( props.name );
				const blockDefaultAlign = blockType.attributes?.align?.default;
				if ( blockDefaultAlign ) {
					nextAlign = '';
				}
			}
			props.setAttributes( { align: nextAlign } );
		};

		return [
			validAlignments.length > 0 && props.isSelected && (
				<BlockControls key="align-controls">
					<BlockAlignmentToolbar
						value={ props.attributes.align }
						onChange={ updateAlignment }
						controls={ validAlignments }
					/>
				</BlockControls>
			),
			<BlockEdit key="edit" { ...props } />,
		];
	},
	'withToolbarControls'
);

/**
 * Override the default block element to add alignment wrapper props.
 *
 * @param  {Function} BlockListBlock Original component
 * @return {Function}                Wrapped component
 */
export const withDataAlign = createHigherOrderComponent(
	( BlockListBlock ) => ( props ) => {
		const { name, attributes } = props;
		const { align } = attributes;
		const hasWideEnabled = useSelect(
			( select ) =>
				!! select( 'core/block-editor' ).getSettings().alignWide,
			[]
		);

		// If an alignment is not assigned, there's no need to go through the
		// effort to validate or assign its value.
		if ( align === undefined ) {
			return <BlockListBlock { ...props } />;
		}

		const validAlignments = getValidAlignments(
			getBlockSupport( name, 'align' ),
			hasBlockSupport( name, 'alignWide', true ),
			hasWideEnabled
		);

		let wrapperProps = props.wrapperProps;
		if ( validAlignments.includes( align ) ) {
			wrapperProps = { ...wrapperProps, 'data-align': align };
		}

		return <BlockListBlock { ...props } wrapperProps={ wrapperProps } />;
	}
);

/**
 * Override props assigned to save component to inject alignment class name if
 * block supports it.
 *
 * @param  {Object} props      Additional props applied to save element
 * @param  {Object} blockType  Block type
 * @param  {Object} attributes Block attributes
 * @return {Object}            Filtered props applied to save element
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
		props.className = classnames( `align${ align }`, props.className );
	}

	return props;
}

addFilter(
	'blocks.registerBlockType',
	'core/align/addAttribute',
	addAttribute
);
addFilter(
	'editor.BlockListBlock',
	'core/editor/align/with-data-align',
	withDataAlign
);
addFilter(
	'editor.BlockEdit',
	'core/editor/align/with-toolbar-controls',
	withToolbarControls
);
addFilter(
	'blocks.getSaveContent.extraProps',
	'core/align/addAssignedAlign',
	addAssignedAlign
);
