/**
 * External dependencies
 */
import classnames from 'classnames';
import { colord, extend } from 'colord';
import namesPlugin from 'colord/plugins/names';

/**
 * WordPress dependencies
 */
import { getBlockSupport, hasBlockSupport } from '@wordpress/blocks';
import { SVG } from '@wordpress/components';
import { createHigherOrderComponent, useInstanceId } from '@wordpress/compose';
import { addFilter } from '@wordpress/hooks';
import { useMemo, useContext, createPortal } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

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

extend( [ namesPlugin ] );

/**
 * Convert a list of colors to an object of R, G, and B values.
 *
 * @param {string[]} colors Array of RBG color strings.
 *
 * @return {Object} R, G, and B values.
 */
export function getValuesFromColors( colors = [] ) {
	const values = { r: [], g: [], b: [], a: [] };

	colors.forEach( ( color ) => {
		const rgbColor = colord( color ).toRgb();
		values.r.push( rgbColor.r / 255 );
		values.g.push( rgbColor.g / 255 );
		values.b.push( rgbColor.b / 255 );
		values.a.push( rgbColor.a );
	} );

	return values;
}

/**
 * SVG and stylesheet needed for rendering the duotone filter.
 *
 * @param {Object}   props          Duotone props.
 * @param {string}   props.selector Selector to apply the filter to.
 * @param {string}   props.id       Unique id for this duotone filter.
 *
 * @return {WPElement} Duotone element.
 */
function DuotoneStylesheet( { selector, id } ) {
	const css = `
${ selector } {
	filter: url( #${ id } );
}
`;
	return <style>{ css }</style>;
}

/**
 * Stylesheet for disabling a global styles duotone filter.
 *
 * @param {Object}   props          Duotone props.
 * @param {string}   props.selector Selector to disable the filter for.
 *
 * @return {WPElement} Filter none style element.
 */
function DuotoneUnsetStylesheet( { selector } ) {
	const css = `
${ selector } {
	filter: none;
}
`;
	return <style>{ css }</style>;
}

/**
 * The SVG part of the duotone filter.
 *
 * @param {Object}   props        Duotone props.
 * @param {string}   props.id     Unique id for this duotone filter.
 * @param {string[]} props.colors Color strings from dark to light.
 *
 * @returns {WPElement} Duotone SVG.
 */
function DuotoneFilter( { id, colors } ) {
	const values = getValuesFromColors( colors );
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
						// Use sRGB instead of linearRGB so transparency looks correct.
						colorInterpolationFilters="sRGB"
						type="matrix"
						// Use perceptual brightness to convert to grayscale.
						values="
							.299 .587 .114 0 0
							.299 .587 .114 0 0
							.299 .587 .114 0 0
							.299 .587 .114 0 0
						"
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
						<feFuncA
							type="table"
							tableValues={ values.a.join( ' ' ) }
						/>
					</feComponentTransfer>
					<feComposite
						// Re-mask the image with the original transparency since the feColorMatrix above loses that information.
						in2="SourceGraphic"
						operator="in"
					/>
				</filter>
			</defs>
		</SVG>
	);
}

/**
 * SVG and stylesheet needed for rendering the duotone filter.
 *
 * @param {Object}   props          Duotone props.
 * @param {string}   props.selector Selector to apply the filter to.
 * @param {string}   props.id       Unique id for this duotone filter.
 * @param {string[]} props.colors   Array of RGB color strings ordered from dark to light.
 *
 * @return {WPElement} Duotone element.
 */
function InlineDuotone( { selector, id, colors } ) {
	if ( colors.length === 0 ) {
		return <DuotoneUnsetStylesheet selector={ selector } />;
	}

	return (
		<>
			<DuotoneFilter id={ id } colors={ colors } />
			<DuotoneStylesheet id={ id } selector={ selector } />
		</>
	);
}

function useMultiOriginPresets( { presetSetting, defaultSetting } ) {
	const disableDefault = ! useSetting( defaultSetting );
	const userPresets =
		useSetting( `${ presetSetting }.custom` ) || EMPTY_ARRAY;
	const themePresets =
		useSetting( `${ presetSetting }.theme` ) || EMPTY_ARRAY;
	const defaultPresets =
		useSetting( `${ presetSetting }.default` ) || EMPTY_ARRAY;
	const unsetPreset = {
		colors: EMPTY_ARRAY,
		slug: 'unset',
		name: __( 'Unset' ),
	};
	return useMemo(
		() => [
			unsetPreset,
			...userPresets,
			...themePresets,
			...( disableDefault ? EMPTY_ARRAY : defaultPresets ),
		],
		[ disableDefault, userPresets, themePresets, defaultPresets ]
	);
}

function DuotonePanel( { attributes, setAttributes } ) {
	const style = attributes?.style;
	const duotone = style?.color?.duotone;

	const duotonePalette = useMultiOriginPresets( {
		presetSetting: 'color.duotone',
		defaultSetting: 'color.defaultDuotone',
	} );
	const colorPalette = useMultiOriginPresets( {
		presetSetting: 'color.palette',
		defaultSetting: 'color.defaultPalette',
	} );
	const disableCustomColors = ! useSetting( 'color.custom' );
	const disableCustomDuotone =
		! useSetting( 'color.customDuotone' ) ||
		( colorPalette?.length === 0 && disableCustomColors );

	if ( duotonePalette?.length === 0 && disableCustomDuotone ) {
		return null;
	}

	return (
		<BlockControls group="block" __experimentalShareWithChildBlocks>
			<DuotoneControl
				duotonePalette={ duotonePalette }
				colorPalette={ colorPalette }
				disableCustomDuotone={ disableCustomDuotone }
				disableCustomColors={ disableCustomColors }
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

	return settings;
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
 * Function that scopes a selector with another one. This works a bit like
 * SCSS nesting except the `&` operator isn't supported.
 *
 * @example
 * ```js
 * const scope = '.a, .b .c';
 * const selector = '> .x, .y';
 * const merged = scopeSelector( scope, selector );
 * // merged is '.a > .x, .a .y, .b .c > .x, .b .c .y'
 * ```
 *
 * @param {string} scope    Selector to scope to.
 * @param {string} selector Original selector.
 *
 * @return {string} Scoped selector.
 */
function scopeSelector( scope, selector ) {
	const scopes = scope.split( ',' );
	const selectors = selector.split( ',' );

	const selectorsScoped = [];
	scopes.forEach( ( outer ) => {
		selectors.forEach( ( inner ) => {
			selectorsScoped.push( `${ outer.trim() } ${ inner.trim() }` );
		} );
	} );

	return selectorsScoped.join( ', ' );
}

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
		const colors = props?.attributes?.style?.color?.duotone;

		if ( ! duotoneSupport || ! colors ) {
			return <BlockListBlock { ...props } />;
		}

		const id = `wp-duotone-${ useInstanceId( BlockListBlock ) }`;

		// Extra .editor-styles-wrapper specificity is needed in the editor
		// since we're not using inline styles to apply the filter. We need to
		// override duotone applied by global styles and theme.json.
		const selectorsGroup = scopeSelector(
			`.editor-styles-wrapper .${ id }`,
			duotoneSupport
		);

		const className = classnames( props?.className, id );

		const element = useContext( BlockList.__unstableElementContext );

		return (
			<>
				{ element &&
					createPortal(
						<InlineDuotone
							selector={ selectorsGroup }
							id={ id }
							colors={ colors }
						/>,
						element
					) }
				<BlockListBlock { ...props } className={ className } />
			</>
		);
	},
	'withDuotoneStyles'
);

export function PresetDuotoneFilter( { preset } ) {
	return (
		<DuotoneFilter
			id={ `wp-duotone-${ preset.slug }` }
			values={ getValuesFromColors( preset.colors ) }
		/>
	);
}

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
