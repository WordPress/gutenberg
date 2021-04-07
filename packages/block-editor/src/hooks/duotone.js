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
import { addFilter } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import {
	BlockControls,
	DuotoneControl,
	__experimentalUseEditorFeature as useEditorFeature,
} from '../components';

/**
 * Values for the SVG `feComponentTransfer`.
 *
 * @typedef Values {Object}
 * @property {number[]} r Red values.
 * @property {number[]} g Green values.
 * @property {number[]} b Blue values.
 */

/**
 * SVG needed for rendering the duotone filter.
 *
 * @param  {Object} props          Duotone props.
 * @param  {string} props.id       Unique id for this duotone filter.
 * @param  {Values} props.values   R, G, and B values to filter with.
 * @return {WPElement}             Duotone element.
 */
function DuotoneFilter( { id, values } ) {
	return (
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
	);
}

/**
 * Stylesheet needed for rendering the duotone filter.
 *
 * @param  {Object} props          Duotone props.
 * @param  {string} props.id       Unique id for this duotone filter.
 * @param  {string} props.selector Selector to apply the filter to.
 * @return {WPElement}             Duotone element.
 */
function DuotoneStylesheet( { id, selector } ) {
	const stylesheet = `
${ selector } {
	filter: url( #${ id } );
}
`;
	return <style dangerouslySetInnerHTML={ { __html: stylesheet } } />;
}

function DuotonePanel( { attributes, setAttributes } ) {
	const style = attributes?.style;
	const duotone = style?.color?.duotone;

	const duotonePalette = useEditorFeature( 'color.duotone' );
	const colorPalette = useEditorFeature( 'color.palette' );

	return (
		<BlockControls group="block">
			<DuotoneControl
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
const withDuotoneControls = createHigherOrderComponent(
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
	'withDuotoneControls'
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
		const duotoneAttribute = props?.attributes?.style?.color?.duotone;

		if ( ! duotoneSupport || ! duotoneAttribute ) {
			return <BlockListBlock { ...props } />;
		}

		const { slug, values } = duotoneAttribute;
		const id = `wp-duotone-filter-${
			slug ?? useInstanceId( BlockListBlock )
		}`;

		const selectors = duotoneSupport.split( ',' );
		const selectorsScoped = selectors.map(
			( selector ) => `.${ id } ${ selector.trim() }`
		);
		const selectorsGroup = selectorsScoped.join( ', ' );

		const className = classnames( props?.classname, id );

		return (
			<>
				<DuotoneFilter id={ id } values={ values } />
				<DuotoneStylesheet id={ id } selector={ selectorsGroup } />
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
	'editor.BlockEdit',
	'core/editor/duotone/with-editor-controls',
	withDuotoneControls
);
addFilter(
	'editor.BlockListBlock',
	'core/editor/duotone/with-styles',
	withDuotoneStyles
);
