/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { getBlockSupport, hasBlockSupport } from '@wordpress/blocks';
import { SVG } from '@wordpress/components';
import { createHigherOrderComponent, useInstanceId } from '@wordpress/compose';
import { useEffect, useMemo } from '@wordpress/element';
import { addFilter } from '@wordpress/hooks';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import {
	BlockControls,
	DuotoneToolbar,
	__experimentalUseEditorFeature as useEditorFeature,
} from '../components';

/**
 * Used so memoized function doesn't recompute for new empty arrays.
 */
const EMPTY_ARRAY = [];

// TODO: Remove when gradients are pulled from theme.json
const GRAYSCALE_GRADIENTS = [
	{
		name: __( 'Dark grayscale' ),
		gradient: 'linear-gradient(135deg,#7f7f7f 0%,#000000 100%)',
		slug: 'dark-grayscale',
	},
	{
		name: __( 'Grayscale' ),
		gradient: 'linear-gradient(135deg,#ffffff 0%,#000000 100%)',
		slug: 'grayscale',
	},
	{
		name: __( 'Light grayscale' ),
		gradient: 'linear-gradient(135deg,#ffffff 0%,#7f7f7f 100%)',
		slug: 'light-grayscale',
	},
];

// TODO: Remove when gradients are pulled from theme.json
const COLOR_REGEX = /rgba?\([0-9,\s]*\)|#[a-fA-F0-9]{3,8}/g;
function parseGradientColors( cssGradient = '' ) {
	const stops = [];

	let match;
	while ( ( match = COLOR_REGEX.exec( cssGradient ) ) ) {
		stops.push( match[ 0 ] );
	}

	// Reverse the list because most default gradients work better that way.
	return stops.reverse();
}

/**
 * Filters registered block settings, extending attributes to include
 * `duotoneId` and `duotoneValues` attributes.
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
	if ( ! settings.attributes.textColor ) {
		Object.assign( settings.attributes, {
			duotoneId: {
				type: 'number',
			},
		} );
	}
	if ( ! settings.attributes.duotoneValues ) {
		Object.assign( settings.attributes, {
			duotoneValues: {
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

		const instanceId = useInstanceId( BlockEdit );
		useEffect( () => {
			setAttributes( {
				duotoneId: attributes.duotoneValues
					? `duotone-filter-${ instanceId }`
					: undefined,
			} );
		}, [ instanceId, attributes.duotoneValues ] );

		// TODO: Remove this as it was an experiment for using theme gradients.
		// It will be replaced with custom duotone/multitone color lists.
		const gradients = useEditorFeature( 'color.gradients' ) || EMPTY_ARRAY;
		const options = useMemo(
			() =>
				[ ...gradients, ...GRAYSCALE_GRADIENTS ].map( ( swatch ) => ( {
					colors: parseGradientColors( swatch.gradient ),
					...swatch,
				} ) ),
			[ gradients ]
		);

		return (
			<>
				<BlockEdit { ...props } />
				{ attributes.duotoneValues && attributes.duotoneId ? (
					<Duotone
						selector={ duotoneSelector }
						id={ attributes.duotoneId }
						values={ attributes.duotoneValues }
					/>
				) : null }
				<BlockControls>
					<DuotoneToolbar
						value={ attributes.duotoneValues }
						options={ options }
						onChange={ ( duotoneValues ) => {
							setAttributes( { duotoneValues } );
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

	if (
		! hasDuotoneSupport ||
		! attributes.duotoneId ||
		! attributes.duotoneValues
	) {
		return props;
	}

	return {
		...props,
		className: classnames( props.className, attributes.duotoneId ),
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
