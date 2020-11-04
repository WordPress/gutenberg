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
		const duotoneSupport = getBlockSupport( props.name, 'duotone' );

		if ( ! duotoneSupport ) {
			return <BlockEdit { ...props } />;
		}

		const {
			attributes: { duotone },
			setAttributes,
		} = props;

		// Object | boolean | string | string[] -> boolean | string | string[]
		const editSelectors =
			duotoneSupport.edit === undefined
				? duotoneSupport
				: duotoneSupport.edit;

		const duotonePalette = useEditorFeature( 'color.duotone' );

		const colorPalette = useEditorFeature( 'color.palette' );

		return (
			<>
				<BlockControls>
					<DuotoneToolbar
						value={ duotone }
						duotonePalette={ duotonePalette }
						colorPalette={ colorPalette }
						onChange={ ( newDuotone ) => {
							setAttributes( { duotone: newDuotone } );
						} }
					/>
				</BlockControls>
				<div
					className={ duotone && `duotone-filter-${ duotone.slug }` }
				>
					<BlockEdit { ...props } />
				</div>
				{ duotone && (
					<DuotoneFilter
						slug={ duotone.slug }
						selectors={ editSelectors }
						values={ duotone.values }
					/>
				) }
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
