/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { getBlockSupport, hasBlockSupport } from '@wordpress/blocks';
import { createHigherOrderComponent } from '@wordpress/compose';
import { addFilter } from '@wordpress/hooks';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import {
	BlockControls,
	__experimentalDuotoneToolbar as DuotoneToolbar,
	__experimentalDuotoneFilter as DuotoneFilter,
	__experimentalUseEditorFeature as useEditorFeature,
} from '../components';

/**
 * Duotone colors used when the theme doesn't include any.
 */
const DEFAULT_DUOTONE_OPTIONS = [
	{
		name: __( 'Dark grayscale' ),
		colors: [ '#000000', '#7f7f7f' ],
		slug: 'dark-grayscale',
	},
	{
		name: __( 'Grayscale' ),
		colors: [ '#000000', '#ffffff' ],
		slug: 'grayscale',
	},
	{
		name: __( 'Green and Yellow' ),
		colors: [ '#00e400', '#f9ff00' ],
		slug: 'green-yellow',
	},
	{
		name: __( 'Red and Blue' ),
		colors: [ '#ff0000', '#0705ff' ],
		slug: 'red-blue',
	},
	{
		name: __( 'Midnight' ),
		colors: [ '#03005d', '#0090ff' ],
		slug: 'midnight',
	},
	{
		name: __( 'Orange and Yellow' ),
		colors: [ '#ff4b00', '#ffe400' ],
		slug: 'orange-yellow',
	},
	{
		name: __( 'Magenta and Lime' ),
		colors: [ '#ff00ac', '#a8ff76' ],
		slug: 'magenta-lime',
	},
	{
		name: __( 'Blue and Green' ),
		colors: [ '#0410ff', '#00ff00' ],
		slug: 'blue-green',
	},
];

/**
 * Filters registered block settings, extending attributes to include
 * the `duotone` attribute.
 *
 * @param  {Object} settings Original block settings
 * @return {Object}          Filtered block settings
 */
function addDuotoneAttributes( settings ) {
	if ( ! hasBlockSupport( settings, 'duotone' ) ) {
		return settings;
	}

	// Allow blocks to specify their own attribute definition with default
	// values if needed.
	if ( ! settings.attributes.duotone ) {
		Object.assign( settings.attributes, {
			duotone: {
				type: 'object',
			},
		} );
	}

	return settings;
}

/**
 * Override the default edit UI to include toolbar controls for duotone if the
 * block supports duotone.
 *
 * @param  {Function} BlockEdit Original component
 * @return {Function}           Wrapped component
 */
const withDuotoneToolbarControls = createHigherOrderComponent(
	( BlockEdit ) => ( props ) => {
		const { name: blockName, attributes, setAttributes, clientId } = props;

		const duotoneSupport = getBlockSupport( blockName, 'duotone' );

		if ( ! duotoneSupport ) {
			return <BlockEdit { ...props } />;
		}

		// Object | boolean | string | string[] -> boolean | string | string[]
		const editSelectors =
			duotoneSupport.edit === undefined
				? duotoneSupport
				: duotoneSupport.edit;

		const duotonePalette =
			useEditorFeature( 'color.duotone' ) ?? DEFAULT_DUOTONE_OPTIONS;

		const colorPalette =
			useEditorFeature( 'color.palette' ) ?? DEFAULT_DUOTONE_OPTIONS;

		return (
			<>
				<BlockEdit { ...props } />
				{ attributes.duotone ? (
					<DuotoneFilter
						slug={ attributes.duotone.slug }
						scope={ `#block-${ clientId }` }
						selectors={ editSelectors }
						values={ attributes.duotone.values }
					/>
				) : null }
				<BlockControls>
					<DuotoneToolbar
						value={ attributes.duotone }
						duotonePalette={ duotonePalette }
						colorPalette={ colorPalette }
						onChange={ ( duotone ) => {
							setAttributes( { duotone } );
						} }
					/>
				</BlockControls>
			</>
		);
	},
	'withDuotoneToolbarControls'
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
function addDuotoneFilterStyle( props, blockType, attributes ) {
	const hasDuotoneSupport = hasBlockSupport( blockType, 'duotone' );

	if ( ! hasDuotoneSupport || ! attributes.duotone ) {
		return props;
	}

	return {
		...props,
		className: classnames(
			props.className,
			`duotone-filter-${ attributes.duotone.slug }`
		),
	};
}

addFilter(
	'editor.BlockEdit',
	'core/editor/duotone/with-editor-controls',
	withDuotoneToolbarControls
);
addFilter(
	'blocks.registerBlockType',
	'core/editor/duotone/add-attributes',
	addDuotoneAttributes
);
addFilter(
	'blocks.getSaveContent.extraProps',
	'core/editor/duotone/add-filter-style',
	addDuotoneFilterStyle
);
