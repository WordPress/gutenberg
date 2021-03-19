/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { getBlockDefaultClassName, getBlockSupport } from '@wordpress/blocks';
import { ToolbarGroup } from '@wordpress/components';
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
	if ( ! getBlockSupport( settings, 'color.duotone' ) ) {
		return settings;
	}

	// Allow blocks to specify their own attribute definition with default
	// values if needed.
	if ( ! settings.attributes.style ) {
		Object.assign( settings.attributes, {
			style: {
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
		const duotoneSupport = getBlockSupport( props.name, 'color.duotone' );

		if ( ! duotoneSupport ) {
			return <BlockEdit { ...props } />;
		}

		const { attributes, setAttributes } = props;
		const style = attributes?.style;
		const duotone = style?.color?.duotone;

		const duotonePalette = useEditorFeature( 'color.duotone' );
		const colorPalette = useEditorFeature( 'color.palette' );

		// Adding the block class as to not affect other blocks.
		const blockClass = getBlockDefaultClassName( props.name );

		// Wrapper div has the filter class, so it comes before blockClass.
		const scope = duotone
			? `.${ duotone.id } .${ blockClass }`
			: `.${ blockClass }`;

		// Object | boolean | string | string[] -> boolean | string | string[]
		const selectors =
			duotoneSupport.edit === undefined
				? duotoneSupport
				: duotoneSupport.edit;

		// boolean | string | string[] -> boolean[] | string[]
		const selectorsArray = Array.isArray( selectors )
			? selectors
			: [ selectors ];

		// boolean[] | string[] -> string[]
		const scopedSelectors = selectorsArray.map( ( selector ) =>
			typeof selector === 'string' ? `${ scope } ${ selector }` : scope
		);

		// string[] -> string
		const selector = scopedSelectors.join( ', ' );

		return (
			<>
				<BlockControls>
					<ToolbarGroup>
						<DuotoneToolbar
							value={ duotone }
							duotonePalette={ duotonePalette }
							colorPalette={ colorPalette }
							onChange={ ( newDuotone ) => {
								const newStyle = {
									...style,
									color: {
										...style?.color,
										duotone: newDuotone,
									},
								};
								setAttributes( { style: newStyle } );
							} }
						/>
					</ToolbarGroup>
				</BlockControls>
				<div className={ duotone?.id }>
					<BlockEdit { ...props } />
				</div>
				{ duotone && (
					<DuotoneFilter
						selector={ selector }
						id={ duotone.id }
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
	const duotoneSupport = getBlockSupport( blockType, 'color.duotone' );

	if ( ! duotoneSupport || ! attributes?.style?.color?.duotone ) {
		return props;
	}

	return {
		...props,
		className: classnames(
			props.className,
			attributes.style.color.duotone.id
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
