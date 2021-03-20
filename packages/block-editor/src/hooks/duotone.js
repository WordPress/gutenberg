/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	getBlockDefaultClassName,
	getBlockSupport,
	hasBlockSupport,
} from '@wordpress/blocks';
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

function DuotonePanel( { attributes, setAttributes } ) {
	const style = attributes?.style;
	const duotone = style?.color?.duotone;

	const duotonePalette = useEditorFeature( 'color.duotone' );
	const colorPalette = useEditorFeature( 'color.palette' );

	return (
		<BlockControls group="block">
			<DuotoneToolbar
				duotonePalette={ duotonePalette }
				colorPalette={ colorPalette }
				value={ duotone }
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
		</BlockControls>
	);
}

/**
 * Filters registered block settings, extending attributes to include
 * the `duotone` attribute.
 *
 * @param  {Object} settings Original block settings
 * @return {Object}          Filtered block settings
 */
function addDuotoneAttributes( settings ) {
	if ( ! hasBlockSupport( settings, 'color.duotone' ) ) {
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
		const hasDuotoneSupport = hasBlockSupport(
			props.name,
			'color.duotone'
		);

		return (
			<>
				<BlockEdit { ...props } />
				{ hasDuotoneSupport && <DuotonePanel { ...props } /> }
			</>
		);
	},
	'withDuotoneToolbarControls'
);

/**
 * Override the default block element to include duotone styles.
 *
 * @param  {Function} BlockListBlock Original component
 * @return {Function}                Wrapped component
 */
const withDuotoneStyles = createHigherOrderComponent(
	( BlockListBlock ) => ( props ) => {
		const duotoneSupport = getBlockSupport( props.name, 'color.duotone' );

		const style = props?.attributes?.style;
		const duotone = style?.color?.duotone;

		if ( ! duotoneSupport || ! duotone ) {
			return <BlockListBlock { ...props } />;
		}

		const className = classnames( props?.classname, duotone.id );

		// Adding the block class as to not affect other blocks.
		const blockClass = getBlockDefaultClassName( props.name );
		const scope = `.${ blockClass }.${ duotone.id }`;

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
				<DuotoneFilter selector={ selector } { ...duotone } />
				<BlockListBlock { ...props } className={ className } />
			</>
		);
	},
	'withDuotoneStyles'
);

/**
 * Override props assigned to save component to inject duotone classname if the
 * block supports it.
 *
 * @param  {Object} props      Additional props applied to save element
 * @param  {Object} blockType  Block type
 * @param  {Object} attributes Block attributes
 * @return {Object}            Filtered props applied to save element
 */
function addDuotoneFilterStyle( props, blockType, attributes ) {
	const hasDuotoneSupport = hasBlockSupport( blockType, 'color.duotone' );

	if ( ! hasDuotoneSupport || ! attributes?.style?.color?.duotone ) {
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
	'blocks.registerBlockType',
	'core/editor/duotone/add-attributes',
	addDuotoneAttributes
);
addFilter(
	'editor.BlockEdit',
	'core/editor/duotone/with-editor-controls',
	withDuotoneToolbarControls
);
addFilter(
	'editor.BlockListBlock',
	'core/editor/duotone/with-styles',
	withDuotoneStyles
);
addFilter(
	'blocks.getSaveContent.extraProps',
	'core/editor/duotone/add-filter-style',
	addDuotoneFilterStyle
);
