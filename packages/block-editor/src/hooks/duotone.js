/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { getBlockSupport, hasBlockSupport } from '@wordpress/blocks';
import { SVG } from '@wordpress/components';
import { createHigherOrderComponent } from '@wordpress/compose';
import { addFilter } from '@wordpress/hooks';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import {
	BlockControls,
	__experimentalDuotoneToolbar as DuotoneToolbar,
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
		name: __( 'Light grayscale' ),
		colors: [ '#7f7f7f', '#ffffff' ],
		slug: 'light-grayscale',
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
 * SVG and stylesheet needed for rendering the duotone filter.
 *
 * @param  {Object} props          Duotone props.
 * @param  {string} props.id       Unique id for this duotone filter.
 * @param  {Object} props.values   R, G, and B values to filter with.
 * @param  {string} props.selector CSS selector to apply the filter to.
 * @return {WPElement}             Duotone element.
 */
function Duotone( { id, values, selector } ) {
	const stylesheet = `
${ selector } {
	filter: url( #${ id } );
}
`;

	return (
		<>
			<SVG
				xmlnsXlink="http://www.w3.org/1999/xlink"
				viewBox="0 0 0 0"
				width="0"
				height="0"
				focusable="false"
				role="none"
				style={ {
					visibility: 'hidden',
					position: 'absolute',
					left: '-9999px',
					overflow: 'hidden',
				} }
			>
				<defs>
					<filter id={ id }>
						<feColorMatrix
							type="matrix"
							// Use perceptual brightness to convert to grayscale.
							// prettier-ignore
							values=".299 .587 .114 0 0
							        .299 .587 .114 0 0
							        .299 .587 .114 0 0
							        0 0 0 1 0"
						/>
						<feComponentTransfer colorInterpolationFilters="sRGB">
							<feFuncR
								type="table"
								tableValues={ values.r.join( ' ' ) }
							/>
							<feFuncG
								type="table"
								tableValues={ values.g.join( ' ' ) }
							/>
							<feFuncB
								type="table"
								tableValues={ values.b.join( ' ' ) }
							/>
						</feComponentTransfer>
					</filter>
				</defs>
			</SVG>
			<style dangerouslySetInnerHTML={ { __html: stylesheet } } />
		</>
	);
}

export default Duotone;

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

		const duotoneBlockSupport = getBlockSupport( blockName, 'duotone' );

		if ( ! duotoneBlockSupport ) {
			return <BlockEdit { ...props } />;
		}

		// TODO: Handle multiple selectors. Cover will need to select img or video.
		let duotoneSelector = `#block-${ clientId }`;
		if ( typeof duotoneBlockSupport === 'string' ) {
			duotoneSelector += ` ${ duotoneBlockSupport }`;
		} else if ( typeof duotoneBlockSupport.edit === 'string' ) {
			duotoneSelector += ` ${ duotoneBlockSupport.edit }`;
		}

		const duotoneOptions =
			useEditorFeature( 'color.duotone' ) || DEFAULT_DUOTONE_OPTIONS;

		return (
			<>
				<BlockEdit { ...props } />
				{ attributes.duotone ? (
					<Duotone
						selector={ duotoneSelector }
						id={ `duotone-filter-${ attributes.duotone.slug }` }
						values={ attributes.duotone.values }
					/>
				) : null }
				<BlockControls>
					<DuotoneToolbar
						value={ attributes.duotone }
						options={ duotoneOptions }
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
