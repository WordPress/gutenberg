/**
 * External dependencies
 */
import classnames from 'classnames';
import tinycolor from 'tinycolor2';

/**
 * WordPress dependencies
 */
import { getBlockSupport, hasBlockSupport } from '@wordpress/blocks';
import { SVG } from '@wordpress/components';
import { createHigherOrderComponent, useInstanceId } from '@wordpress/compose';
import { addFilter } from '@wordpress/hooks';
import { useContext, createPortal } from '@wordpress/element';

/**
 * Internal dependencies
 */
import {
	BlockControls,
	__experimentalDuotoneControl as DuotoneControl,
	useSetting,
} from '../components';
import BlockList from '../components/block-list';

const EMPTY_ARRAY = [];

/**
 * Convert a list of colors to an object of R, G, and B values.
 *
 * @param {string[]} colors Array of RBG color strings.
 *
 * @return {Object} R, G, and B values.
 */
export function getValuesFromColors( colors = [] ) {
	const values = { r: [], g: [], b: [] };

	colors.forEach( ( color ) => {
		// Access values directly to skip extra rounding that tinycolor.toRgb() does.
		const tcolor = tinycolor( color );
		values.r.push( tcolor._r / 255 );
		values.g.push( tcolor._g / 255 );
		values.b.push( tcolor._b / 255 );
	} );

	return values;
}

/**
 * Values for the SVG `feComponentTransfer`.
 *
 * @typedef Values {Object}
 * @property {number[]} r Red values.
 * @property {number[]} g Green values.
 * @property {number[]} b Blue values.
 */

/**
 * SVG and stylesheet needed for rendering the duotone filter.
 *
 * @param {Object} props          Duotone props.
 * @param {string} props.selector Selector to apply the filter to.
 * @param {string} props.id       Unique id for this duotone filter.
 * @param {Values} props.values   R, G, and B values to filter with.
 *
 * @return {WPElement} Duotone element.
 */
function DuotoneFilter( { selector, id, values } ) {
	const stylesheet = `
${ selector } {
	filter: url( #${ id } ) !important; /* We need !important to overide rules that come from theme.json.*/
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
						<feComponentTransfer
							// Use sRGB instead of linearRGB to be consistent with how CSS gradients work.
							colorInterpolationFilters="sRGB"
						>
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

function DuotonePanel( { attributes, setAttributes } ) {
	const duotonePalette = useSetting( 'color.duotone' ) || EMPTY_ARRAY;
	const colorPalette = useSetting( 'color.palette' ) || EMPTY_ARRAY;
	const disableCustomColors = ! useSetting( 'color.custom' );
	const disableCustomDuotone =
		! useSetting( 'color.customDuotone' ) ||
		( colorPalette?.length === 0 && disableCustomColors );

	if ( duotonePalette?.length === 0 && disableCustomDuotone ) {
		return null;
	}

	const style = attributes?.style;
	// TODO: There might be too much conversion going on between slug and colors now. Maybe worth checking if it can be simplified at all.
	const duotone =
		style?.color?.duotone ||
		duotonePalette.find( ( { slug } ) => slug === attributes?.duotone )
			?.colors;

	return (
		<BlockControls group="block" __experimentalExposeToChildren>
			<DuotoneControl
				duotonePalette={ duotonePalette }
				colorPalette={ colorPalette }
				disableCustomDuotone={ disableCustomDuotone }
				disableCustomColors={ disableCustomColors }
				value={ duotone }
				onChange={ ( newDuotone ) => {
					const slug = duotonePalette.find( ( { colors } ) =>
						colors.every(
							( color, index ) => newDuotone[ index ] === color
						)
					)?.slug;
					const newStyle = {
						...style,
						color: {
							...style?.color,
						},
					};
					if ( slug ) {
						delete newStyle.color.duotone;
					} else {
						newStyle.color.duotone = newDuotone;
					}
					setAttributes( {
						duotone: slug,
						style: newStyle,
					} );
				} }
			/>
		</BlockControls>
	);
}

/**
 * Filters registered block settings, extending attributes to include
 * the `duotone` attribute.
 *
 * @param {Object} settings Original block settings.
 *
 * @return {Object} Filtered block settings.
 */
function addDuotoneAttributes( settings ) {
	if ( ! hasBlockSupport( settings, 'color.__experimentalDuotone' ) ) {
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

	if ( ! settings.attributes.duotone ) {
		Object.assign( settings.attributes, {
			duotone: {
				type: 'string',
			},
		} );
	}

	return settings;
}

function getDuotoneClassName( slug ) {
	return `has-${ slug }-duotone`;
}

/**
 * Override props assigned to save component to inject duotone classnames.
 *
 * @param {Object} props      Additional props applied to save element.
 * @param {Object} blockType  Block type.
 * @param {Object} attributes Block attributes.
 *
 * @return {Object} Filtered props applied to save element.
 */
function addDuotoneClasses( props, blockType, attributes ) {
	const { duotone, style } = attributes;
	if (
		! hasBlockSupport( blockType, 'color.__experimentalDuotone' ) ||
		! duotone ||
		style?.color?.duotone
	) {
		return props;
	}

	props.className = classnames(
		props.className,
		getDuotoneClassName( duotone )
	);

	return props;
}

/**
 * Override the default edit UI to include toolbar controls for duotone if the
 * block supports duotone.
 *
 * @param {Function} BlockEdit Original component.
 *
 * @return {Function} Wrapped component.
 */
const withDuotoneControls = createHigherOrderComponent(
	( BlockEdit ) => ( props ) => {
		const hasDuotoneSupport = hasBlockSupport(
			props.name,
			'color.__experimentalDuotone'
		);

		return (
			<>
				<BlockEdit { ...props } />
				{ hasDuotoneSupport && <DuotonePanel { ...props } /> }
			</>
		);
	},
	'withDuotoneControls'
);

/**
 * Override the default block element to include duotone styles.
 *
 * @param {Function} BlockListBlock Original component.
 *
 * @return {Function} Wrapped component.
 */
const withDuotoneStyles = createHigherOrderComponent(
	( BlockListBlock ) => ( props ) => {
		const duotoneSupport = getBlockSupport(
			props.name,
			'color.__experimentalDuotone'
		);

		if ( ! duotoneSupport ) {
			return <BlockListBlock { ...props } />;
		}

		const customDuotone = props?.attributes?.style?.color?.duotone;
		const namedDuotone = props?.attributes?.duotone;

		if ( namedDuotone && ! customDuotone ) {
			const className = classnames(
				props?.className,
				getDuotoneClassName( namedDuotone )
			);
			return <BlockListBlock { ...props } className={ className } />;
		}

		const id = `wp-duotone-filter-${ useInstanceId( BlockListBlock ) }`;

		const selectors = duotoneSupport.split( ',' );
		const selectorsScoped = selectors.map(
			( selector ) => `.${ id } ${ selector.trim() }`
		);
		const selectorsGroup = selectorsScoped.join( ', ' );

		const className = classnames( props?.className, id );

		const element = useContext( BlockList.__unstableElementContext );

		return (
			<>
				{ element &&
					createPortal(
						<DuotoneFilter
							selector={ selectorsGroup }
							id={ id }
							values={ getValuesFromColors( customDuotone ) }
						/>,
						element
					) }
				<BlockListBlock { ...props } className={ className } />
			</>
		);
	},
	'withDuotoneStyles'
);

addFilter(
	'blocks.registerBlockType',
	'core/editor/duotone/add-attributes',
	addDuotoneAttributes
);
addFilter(
	'blocks.getSaveContent.extraProps',
	'core/color/addSaveProps',
	addDuotoneClasses
);
addFilter(
	'editor.BlockEdit',
	'core/editor/duotone/with-editor-controls',
	withDuotoneControls
);
addFilter(
	'editor.BlockListBlock',
	'core/editor/duotone/with-styles',
	withDuotoneStyles
);
