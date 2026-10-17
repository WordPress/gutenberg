import { useMemo } from '@wordpress/element';
import { addFilter } from '@wordpress/hooks';
import { useSelect } from '@wordpress/data';
import {
	mergeGlobalStyles,
	privateApis as globalStylesEnginePrivateApis,
} from '@wordpress/global-styles-engine';
import {
	getBlockSupport,
	getBlockType,
	hasBlockSupport,
	__EXPERIMENTAL_ELEMENTS as ELEMENTS,
} from '@wordpress/blocks';
import type { BlockType } from '@wordpress/blocks';
import type { GlobalStylesConfig } from '@wordpress/global-styles-engine';
import { useInstanceId } from '@wordpress/compose';
import {
	getCSSRules,
	compileCSS,
	getCSSValueFromRawStyle,
} from '@wordpress/style-engine';
import type { Style } from '@wordpress/style-engine';
import { BACKGROUND_SUPPORT_KEY, BackgroundImagePanel } from './background';
import { BORDER_SUPPORT_KEY, BorderPanel, SHADOW_SUPPORT_KEY } from './border';
import { COLOR_SUPPORT_KEY } from './color';
import { ElementsEdit } from './elements';
import {
	TypographyPanel,
	TYPOGRAPHY_SUPPORT_KEY,
	TYPOGRAPHY_SUPPORT_KEYS,
} from './typography';
import {
	DIMENSIONS_SUPPORT_KEY,
	SPACING_SUPPORT_KEY,
	DimensionsPanel,
	isExplicitAspectRatio,
} from './dimensions';
import {
	cleanEmptyObject,
	shouldSkipSerialization,
	useStyleOverride,
	usePrivateStyleOverride,
	useBlockSettings,
} from './utils';
import {
	BlockStyleStateProvider,
	DEFAULT_BLOCK_STYLE_STATE,
	getStyleForState,
	hasViewportBlockStyleState,
	hasPseudoBlockStyleState,
} from './block-style-state';
import { VALID_BLOCK_PSEUDO_STATES } from './states';
import { buildScopedBlockSelector } from './state-utils';
import { scopeSelector } from '../components/global-styles/utils';
import { useBlockEditingMode } from '../components/block-editing-mode';
import { useSettings } from '../components/use-settings';
import { store as blockEditorStore } from '../store';
import { globalStylesDataKey } from '../store/private-keys';
import { isPlainObject } from '../utils/object';
import { unlock } from '../lock-unlock';
import type {
	PanelBorderSide,
	PanelStyle,
} from '../components/global-styles/types';
import type {
	BlockStyle,
	BlockStyleControlsProps,
	BlockStyleState,
	BlockWrapperProps,
	StateStylesCSSOptions,
} from './types';

interface StyleGroup {
	selector?: string;
	style: BlockStyle;
}

const { getResponsiveMediaQueries } = unlock( globalStylesEnginePrivateApis );

const BORDER_SIDES = [ 'Top', 'Right', 'Bottom', 'Left' ];

const styleSupportKeys = [
	...TYPOGRAPHY_SUPPORT_KEYS,
	BORDER_SUPPORT_KEY,
	COLOR_SUPPORT_KEY,
	DIMENSIONS_SUPPORT_KEY,
	BACKGROUND_SUPPORT_KEY,
	SPACING_SUPPORT_KEY,
	SHADOW_SUPPORT_KEY,
];

const hasStyleSupport = ( nameOrType: string | BlockType ) =>
	styleSupportKeys.some( ( key ) => hasBlockSupport( nameOrType, key ) );

/**
 * Converts a CSS property name into the key a React style object expects.
 *
 * Vendor-prefixed properties are camelCased without their leading dash, so
 * `-webkit-background-clip` becomes `WebkitBackgroundClip`.
 *
 * @param key CSS property name.
 *
 * @return React style object key.
 */
function getReactStyleKey( key: string ): string {
	// Custom properties start with two dashes. React writes them verbatim.
	if ( ! key.startsWith( '-' ) || key.startsWith( '--' ) ) {
		return key;
	}

	const camelCased = key
		.slice( 1 )
		.replace( /-([a-z])/g, ( _, character: string ) =>
			character.toUpperCase()
		);

	// `-ms-` is the one prefix React keeps lowercase, e.g. `msFlexAlign`.
	return key.startsWith( '-ms-' )
		? camelCased
		: camelCased.replace( /^[a-z]/, ( character: string ) =>
				character.toUpperCase()
			);
}

/**
 * Returns the inline styles to add depending on the style object
 *
 * @param styles Styles configuration.
 *
 * @return Flattened CSS variables declaration.
 */
export function getInlineStyles( styles: PanelStyle | undefined = {} ) {
	const output: Record< string, unknown > = {};
	// The goal is to move everything to server side generated engine styles
	// This is temporary as we absorb more and more styles into the engine.
	// The block styles have the shape the style engine reads.
	getCSSRules( styles as Style ).forEach( ( rule ) => {
		output[ getReactStyleKey( rule.key ) ] = rule.value;
	} );

	return output;
}

/**
 * Returns fallback border styles for visible state border styles.
 *
 * State styles are emitted as stylesheet rules rather than inline styles, so
 * they cannot rely on the block-library inline-style attribute fallback rules.
 *
 * @param stateStyles State style object.
 * @return Style object containing fallback border styles.
 */
function getStateFallbackBorderStyles( stateStyles: PanelStyle | undefined ) {
	const border = stateStyles?.border;
	if ( ! border ) {
		return undefined;
	}

	const hasBorderStyle = !! border.style;
	const hasBorderColor = !! border.color;
	const hasBorderWidth = !! border.width;
	const fallbackBorder: Record< string, unknown > = {};

	if ( ! hasBorderStyle && ( hasBorderColor || hasBorderWidth ) ) {
		fallbackBorder.style = 'solid';
	}

	BORDER_SIDES.forEach( ( side ) => {
		const sideKey = side.toLowerCase();
		// The lowercased side names the border of that side.
		const sideBorder = border[ sideKey ] as PanelBorderSide | undefined;
		const hasSideStyle = !! sideBorder?.style;
		const hasSideColor = !! sideBorder?.color;
		const hasSideWidth = !! sideBorder?.width;

		if (
			! hasBorderStyle &&
			! hasSideStyle &&
			( hasSideColor || hasSideWidth )
		) {
			fallbackBorder[ sideKey ] = { style: 'solid' };
		}
	} );

	return cleanEmptyObject( { border: cleanEmptyObject( fallbackBorder ) } );
}

/**
 * Returns background reset CSS for a state that sets a solid background color.
 *
 * When a state sets `color.background` (a solid color) without also setting a
 * gradient (`color.gradient` or `background.gradient`), any gradient applied to
 * the default state via an inline `background` shorthand or `background-image`
 * declaration must be explicitly cleared. Without this, the gradient image layer
 * remains visible even though the solid hover color wins `background-color`.
 *
 * @param stateStyles State style object.
 * @param selector    CSS selector for the generated style.
 * @return CSS string with background-image reset, or undefined.
 */
function getStateBackgroundResetCSS(
	stateStyles: PanelStyle | undefined,
	selector: string | undefined
) {
	const hasSolidBackground = !! stateStyles?.color?.background;

	if ( ! hasSolidBackground ) {
		return undefined;
	}

	const hasColorGradient = !! stateStyles?.color?.gradient;
	const hasBackgroundGradient =
		!! stateStyles?.background?.gradient ||
		!! stateStyles?.background?.backgroundImage;

	if ( hasColorGradient || hasBackgroundGradient ) {
		return undefined;
	}

	const declaration = 'background-image: unset !important';
	return selector
		? `${ selector } { ${ declaration }; }`
		: `${ declaration };`;
}

/**
 * Whether a state paints its own background, which escapes must leave alone.
 *
 * @param stateStyles State style object.
 * @return Whether the state paints its own background.
 */
function paintsItsOwnBackground( stateStyles: PanelStyle | undefined ) {
	return (
		!! stateStyles?.background?.gradient ||
		!! stateStyles?.background?.backgroundImage ||
		!! stateStyles?.color?.gradient
	);
}

/**
 * Returns the CSS that stops a text gradient from below painting as a block
 * background once a state switches to a box clip.
 *
 * @param stateStyles State style object.
 * @param baseStyle   Styles the state layers over.
 * @param selector    CSS selector for the generated style.
 * @return CSS string with the background-image reset.
 */
function getStateTextClipEscapeCSS(
	stateStyles: PanelStyle | undefined,
	baseStyle: PanelStyle | undefined,
	selector: string | undefined
) {
	if ( 'text' !== baseStyle?.background?.backgroundClip ) {
		return undefined;
	}

	const stateClip = stateStyles?.background?.backgroundClip;
	if ( ! stateClip || 'text' === stateClip ) {
		return undefined;
	}

	if ( paintsItsOwnBackground( stateStyles ) ) {
		return undefined;
	}

	const declaration = 'background-image: unset !important';
	return selector
		? `${ selector } { ${ declaration }; }`
		: `${ declaration };`;
}

/**
 * Returns the CSS that shows a state's text color under a text clip from below,
 * which otherwise leaves the fill `transparent`. The clip may come from global
 * styles, which the block cannot see, and the fill does nothing without one.
 *
 * @param stateStyles State style object.
 * @param baseStyle   Styles the state layers over. Without it the
 *                    block cannot sit under a text clip.
 * @param selector    CSS selector for the generated style.
 * @return CSS string with the text fill reset.
 */
function getStateTextFillResetCSS(
	stateStyles: PanelStyle | undefined,
	baseStyle: PanelStyle | undefined,
	selector: string | undefined
) {
	if (
		! baseStyle ||
		! stateStyles?.color?.text ||
		stateStyles?.background?.backgroundClip ||
		paintsItsOwnBackground( stateStyles )
	) {
		return undefined;
	}

	const declaration = '-webkit-text-fill-color: currentColor !important';
	return selector
		? `${ selector } { ${ declaration }; }`
		: `${ declaration };`;
}

/**
 * Returns fallback dimension styles that keep state styles aligned with the
 * default dimensions block-support output.
 *
 * @param stateStyles State style object.
 * @return Style object containing fallback dimension styles.
 */
function getStateFallbackDimensionStyles(
	stateStyles: PanelStyle | undefined
): PanelStyle | undefined {
	const dimensions = stateStyles?.dimensions;
	if ( ! dimensions ) {
		return undefined;
	}

	if ( isExplicitAspectRatio( dimensions.aspectRatio ) ) {
		return {
			dimensions: {
				minHeight: 'unset',
				height: 'unset',
			},
		};
	}

	if ( dimensions.minHeight || dimensions.height ) {
		return {
			dimensions: {
				aspectRatio: 'unset',
			},
		};
	}

	return undefined;
}

/**
 * Returns CSS for text alignment in a block instance state style object.
 *
 * Text alignment is not generated by the style engine because base block
 * alignment is serialized as a class name. State styles need a declaration
 * instead so viewport and pseudo-state values can override the default class.
 *
 * @param stateStyles State style object.
 * @param selector    CSS selector for the generated style.
 * @return CSS string with the text alignment declaration.
 */
function getStateTextAlignCSS(
	stateStyles: PanelStyle | undefined,
	selector: string | undefined
) {
	const textAlign = stateStyles?.typography?.textAlign;

	if ( typeof textAlign !== 'string' || ! textAlign ) {
		return undefined;
	}

	const declaration = `text-align: ${ getCSSValueFromRawStyle(
		textAlign
	) } !important`;
	return selector
		? `${ selector } { ${ declaration }; }`
		: `${ declaration };`;
}

/**
 * Generates CSS for a block instance state style object.
 *
 * State declarations need to win over preset utility classes, but fallback
 * border styles should not become important because they must not override
 * explicitly authored default border styles.
 *
 * @param stateStyles State style object.
 * @param selector    CSS selector for the generated style.
 * @param baseStyle   Styles the state layers over, if any.
 * @return Generated stylesheet.
 */
export function getStateStylesCSS(
	stateStyles: PanelStyle | undefined,
	selector?: string,
	baseStyle?: PanelStyle
): string {
	const fallbackDimensionStyles =
		getStateFallbackDimensionStyles( stateStyles );
	const stylesWithDimensionFallbacks = fallbackDimensionStyles
		? mergeStyleObjects( stateStyles, fallbackDimensionStyles )
		: stateStyles;
	// The block styles have the shape the style engine reads.
	const css = compileCSS( stylesWithDimensionFallbacks as Style, {
		selector,
	} );
	const importantCSS = css ? css.replace( /;/g, ' !important;' ) : undefined;
	const fallbackBorderStyles = getStateFallbackBorderStyles( stateStyles );
	const fallbackCSS = fallbackBorderStyles
		? // The fallback styles have the shape the style engine reads.
			compileCSS( fallbackBorderStyles as Style, { selector } )
		: undefined;
	const textAlignCSS = getStateTextAlignCSS( stateStyles, selector );
	const backgroundResetCSS = getStateBackgroundResetCSS(
		stateStyles,
		selector
	);
	const textClipEscapeCSS = getStateTextClipEscapeCSS(
		stateStyles,
		baseStyle,
		selector
	);
	const textFillResetCSS = getStateTextFillResetCSS(
		stateStyles,
		baseStyle,
		selector
	);

	return [
		importantCSS,
		textAlignCSS,
		fallbackCSS,
		backgroundResetCSS,
		textClipEscapeCSS,
		textFillResetCSS,
	]
		.filter( Boolean )
		.join( '\n' );
}

function mergeStyleObjects(
	target: BlockStyle | undefined = {},
	source: BlockStyle | undefined = {}
): BlockStyle {
	const merged: BlockStyle = { ...target };

	Object.entries( source ).forEach( ( [ key, value ] ) => {
		merged[ key ] =
			isPlainObject( value ) && isPlainObject( merged[ key ] )
				? mergeStyleObjects( merged[ key ], value )
				: value;
	} );

	return merged;
}

function addStyleGroup(
	groups: Map< string, StyleGroup >,
	selector: string | undefined,
	style: BlockStyle
) {
	const key = selector || '';
	const existing = groups.get( key ) || { selector, style: {} };

	groups.set( key, {
		selector,
		style: mergeStyleObjects( existing.style, style ),
	} );
}

function getStateStyleGroups(
	stateStyles: PanelStyle | undefined,
	name: string
) {
	const blockSelectors: NonNullable< BlockType[ 'selectors' ] > =
		getBlockType( name )?.selectors || {};
	const groups = new Map< string, StyleGroup >();

	Object.entries( stateStyles || {} ).forEach(
		( [ feature, featureStyles ] ) => {
			const featureSelectors = blockSelectors[ feature ];

			if ( typeof featureSelectors === 'string' ) {
				addStyleGroup( groups, featureSelectors, {
					[ feature ]: featureStyles,
				} );
				return;
			}

			if (
				isPlainObject( featureSelectors ) &&
				isPlainObject( featureStyles )
			) {
				const remainingStyles = { ...featureStyles };

				Object.entries( featureSelectors ).forEach(
					( [ subfeature, subfeatureSelector ] ) => {
						if (
							subfeature === 'root' ||
							typeof subfeatureSelector !== 'string' ||
							! Object.hasOwn( featureStyles, subfeature )
						) {
							return;
						}

						addStyleGroup( groups, subfeatureSelector, {
							[ feature ]: {
								[ subfeature ]: featureStyles[ subfeature ],
							},
						} );
						delete remainingStyles[ subfeature ];
					}
				);

				if ( Object.keys( remainingStyles ).length ) {
					addStyleGroup(
						groups,
						featureSelectors.root ||
							// The block's root selector is a string.
							( blockSelectors.root as string | undefined ),
						{
							[ feature ]: remainingStyles,
						}
					);
				}
				return;
			}

			// The block's root selector is a string.
			addStyleGroup( groups, blockSelectors.root as string | undefined, {
				[ feature ]: featureStyles,
			} );
		}
	);

	return Array.from( groups.values() );
}

/**
 * Generates CSS for block instance state styles, honoring feature selectors.
 *
 * @param stateStyles          State style object.
 * @param options              Generation options.
 * @param options.name         Block name.
 * @param options.baseSelector Block-instance scoping selector.
 * @param options.state        Optional pseudo-state, e.g. ":hover".
 * @param options.baseStyle    Styles the state layers over.
 * @return Generated stylesheet.
 */
export function getBlockStateStylesCSS(
	stateStyles: PanelStyle | undefined,
	options: StateStylesCSSOptions
) {
	const { name, baseSelector, state = '' } = options;
	// Mirror of the PHP gate: only a block that supports the clip can sit
	// under a text clip to escape.
	const baseStyle = hasBlockSupport( name, [
		BACKGROUND_SUPPORT_KEY,
		'backgroundClip',
	] )
		? ( options.baseStyle ?? {} )
		: undefined;
	const rules = getStateStyleGroups( stateStyles, name )
		.map( ( { selector: blockSelector, style } ) =>
			getStateStylesCSS(
				// Grouping keeps the shape of the state styles.
				style as PanelStyle,
				buildScopedBlockSelector(
					baseSelector,
					blockSelector,
					state,
					name
				),
				baseStyle
			)
		)
		.filter( Boolean );

	return rules.length ? rules.join( '\n' ) : undefined;
}

/**
 * Returns a style object with nested state/element keys removed.
 *
 * Viewport state objects can contain root declarations alongside nested
 * `elements` and pseudo-state styles. Only root declarations should be passed
 * to the style engine for the viewport root selector.
 *
 * @param stateStyles Style object for a selected state.
 * @param nestedKeys  Keys to remove from the root style object.
 * @return Root-only style object.
 */
function getRootStateStyles(
	stateStyles: PanelStyle | undefined,
	nestedKeys: string[]
) {
	if ( ! stateStyles ) {
		return stateStyles;
	}

	const rootStyles = { ...stateStyles };
	nestedKeys.forEach( ( key ) => {
		delete rootStyles[ key ];
	} );
	return rootStyles;
}

/**
 * Generates CSS rules for supported pseudo-state styles.
 *
 * @param style        Block style object containing pseudo-state styles.
 * @param name         Block name.
 * @param baseSelector Base selector used to scope generated CSS.
 * @param baseStyle    Styles these pseudo states layer over.
 * @return Generated CSS rule strings.
 */
function getPseudoStateCSSRules(
	style: PanelStyle | undefined,
	name: string,
	baseSelector: string,
	baseStyle?: PanelStyle
) {
	const validPseudoStates = VALID_BLOCK_PSEUDO_STATES[ name ];
	if ( ! validPseudoStates ) {
		return [];
	}

	const cssRules: string[] = [];
	validPseudoStates.forEach( ( pseudoState ) => {
		// The valid pseudo states start with a colon.
		const stateStyles = style?.[ pseudoState as `:${ string }` ];
		if ( stateStyles ) {
			const css = getBlockStateStylesCSS( stateStyles, {
				name,
				baseSelector,
				state: pseudoState,
				baseStyle,
			} );
			if ( css ) {
				cssRules.push( css );
			}
		}
	} );
	return cssRules;
}

/**
 * Generates CSS rules for responsive block instance style states.
 *
 * Each responsive state can contain root styles, element styles, and nested
 * pseudo-state styles. Generated rules are wrapped in the matching breakpoint
 * media query.
 *
 * @param style            Block style object containing responsive states.
 * @param name             Block name.
 * @param baseSelector     Base selector used to scope generated CSS.
 * @param viewportSettings Viewport breakpoint settings.
 * @return Generated CSS rule strings.
 */
export function getResponsiveStateCSSRules(
	style: PanelStyle | undefined,
	name: string,
	baseSelector: string,
	viewportSettings?: unknown
) {
	const cssRules: string[] = [];
	const validPseudoStates = VALID_BLOCK_PSEUDO_STATES[ name ] ?? [];
	const nestedStateKeys = [ 'elements', ...validPseudoStates ];
	const defaultRootStyles = getRootStateStyles( style, nestedStateKeys );
	const responsiveMediaQueries: Record< string, string > =
		getResponsiveMediaQueries( viewportSettings );

	Object.entries( responsiveMediaQueries ).forEach(
		( [ viewport, mediaQuery ] ) => {
			// The state styles have the shape of the block styles.
			const viewportStyles = getStyleForState( style, {
				viewport,
				pseudo: DEFAULT_BLOCK_STYLE_STATE.pseudo,
			} ) as PanelStyle | undefined;
			if ( ! viewportStyles ) {
				return;
			}

			const viewportCSSRules: string[] = [];
			const viewportRootStyles = getRootStateStyles(
				viewportStyles,
				nestedStateKeys
			);
			const rootCSS = getBlockStateStylesCSS( viewportRootStyles, {
				name,
				baseSelector,
				baseStyle: defaultRootStyles,
			} );
			if ( rootCSS ) {
				viewportCSSRules.push( rootCSS );
			}

			const elementCSS = getElementCSSRules(
				viewportStyles.elements,
				name,
				baseSelector
			);
			if ( elementCSS ) {
				viewportCSSRules.push( elementCSS );
			}

			viewportCSSRules.push(
				...getPseudoStateCSSRules(
					viewportStyles,
					name,
					baseSelector,
					// Merging keeps the shape of the block styles.
					mergeStyleObjects(
						defaultRootStyles,
						viewportRootStyles
					) as PanelStyle
				)
			);

			if ( viewportCSSRules.length ) {
				cssRules.push(
					`${ mediaQuery }{${ viewportCSSRules.join( '' ) }}`
				);
			}
		}
	);

	return cssRules;
}

/**
 * Returns the style value used to force-preview a selected state on canvas.
 *
 * Responsive pseudo states inherit from their default-viewport pseudo state.
 * For example, selecting `@mobile + :hover` should preview styles from
 * `:hover`, with `@mobile.:hover` values layered on top when present.
 *
 * @param style         Block style object.
 * @param selectedState Selected block style state.
 * @return Style value for the canvas preview.
 */
export function getCanvasStateStyleValue(
	style: PanelStyle | undefined,
	selectedState: BlockStyleState | undefined
): PanelStyle | undefined {
	// The state styles have the shape of the block styles.
	const stateValue = getStyleForState( style, selectedState ) as
		PanelStyle | undefined;
	if ( ! hasViewportBlockStyleState( selectedState ) ) {
		return stateValue;
	}

	const defaultViewportState = {
		...selectedState,
		viewport: DEFAULT_BLOCK_STYLE_STATE.viewport,
	};
	// The state styles have the shape of the block styles.
	const defaultViewportStateValue = getStyleForState(
		style,
		defaultViewportState
	) as PanelStyle | undefined;

	if ( defaultViewportStateValue && stateValue ) {
		// Merging deeply works the same for block styles.
		return mergeGlobalStyles(
			defaultViewportStateValue as GlobalStylesConfig,
			stateValue as GlobalStylesConfig
		) as PanelStyle;
	}
	return stateValue || defaultViewportStateValue;
}

/**
 * Filters registered block settings, extending attributes to include `style` attribute.
 *
 * @param settings Original block settings.
 *
 * @return Filtered block settings.
 */
function addAttribute( settings: BlockType ): BlockType {
	if (
		! hasStyleSupport( settings ) &&
		! hasBlockSupport( settings, 'customCSS', true )
	) {
		return settings;
	}

	// Allow blocks to specify their own attribute definition with default values if needed.
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
 * A dictionary of paths to flag skipping block support serialization as the key,
 * with values providing the style paths to be omitted from serialization.
 *
 * @constant
 */
const skipSerializationPathsEdit: Record< string, string[] > = {
	[ `${ BORDER_SUPPORT_KEY }.__experimentalSkipSerialization` ]: [ 'border' ],
	[ `${ COLOR_SUPPORT_KEY }.__experimentalSkipSerialization` ]: [
		COLOR_SUPPORT_KEY,
	],
	[ `${ TYPOGRAPHY_SUPPORT_KEY }.__experimentalSkipSerialization` ]: [
		TYPOGRAPHY_SUPPORT_KEY,
	],
	[ `${ DIMENSIONS_SUPPORT_KEY }.__experimentalSkipSerialization` ]: [
		DIMENSIONS_SUPPORT_KEY,
	],
	[ `${ SPACING_SUPPORT_KEY }.__experimentalSkipSerialization` ]: [
		SPACING_SUPPORT_KEY,
	],
	[ `${ SHADOW_SUPPORT_KEY }.__experimentalSkipSerialization` ]: [
		SHADOW_SUPPORT_KEY,
	],
	[ `${ BACKGROUND_SUPPORT_KEY }.__experimentalSkipSerialization` ]: [
		BACKGROUND_SUPPORT_KEY,
	],
};

/**
 * A dictionary of paths to flag skipping block support serialization as the key,
 * with values providing the style paths to be omitted from serialization.
 *
 * Extends the Edit skip paths to enable skipping additional paths in just
 * the Save component. This allows a block support to be serialized within the
 * editor, while using an alternate approach, such as server-side rendering, when
 * the support is saved.
 *
 * @constant
 */
const skipSerializationPathsSave: Record< string, string[] > = {
	...skipSerializationPathsEdit,
	[ `${ DIMENSIONS_SUPPORT_KEY }.aspectRatio` ]: [
		`${ DIMENSIONS_SUPPORT_KEY }.aspectRatio`,
	], // Skip serialization of aspect ratio in save mode.
	[ `${ BACKGROUND_SUPPORT_KEY }` ]: [ BACKGROUND_SUPPORT_KEY ], // Skip serialization of background support in save mode.
};

const skipSerializationPathsSaveChecks: Record< string, boolean > = {
	[ `${ DIMENSIONS_SUPPORT_KEY }.aspectRatio` ]: true,
	[ `${ BACKGROUND_SUPPORT_KEY }` ]: true,
};

/**
 * A dictionary used to normalize feature names between support flags, style
 * object properties and __experimentSkipSerialization configuration arrays.
 *
 * This allows not having to provide a migration for a support flag and possible
 * backwards compatibility bridges, while still achieving consistency between
 * the support flag and the skip serialization array.
 *
 * @constant
 */
const renamedFeatures: Record< string, string > = { gradients: 'gradient' };

/**
 * A utility function used to remove one or more paths from a style object.
 * Works in a way similar to Lodash's `omit()`. See unit tests and examples below.
 *
 * It supports a single string path:
 *
 * ```
 * omitStyle( { color: 'red' }, 'color' ); // {}
 * ```
 *
 * or an array of paths:
 *
 * ```
 * omitStyle( { color: 'red', background: '#fff' }, [ 'color', 'background' ] ); // {}
 * ```
 *
 * It also allows you to specify paths at multiple levels in a string.
 *
 * ```
 * omitStyle( { typography: { textDecoration: 'underline' } }, 'typography.textDecoration' ); // {}
 * ```
 *
 * You can remove multiple paths at the same time:
 *
 * ```
 * omitStyle(
 * 		{
 * 			typography: {
 * 				textDecoration: 'underline',
 * 				textTransform: 'uppercase',
 * 			}
 *		},
 *		[
 * 			'typography.textDecoration',
 * 			'typography.textTransform',
 *		]
 * );
 * // {}
 * ```
 *
 * You can also specify nested paths as arrays:
 *
 * ```
 * omitStyle(
 * 		{
 * 			typography: {
 * 				textDecoration: 'underline',
 * 				textTransform: 'uppercase',
 * 			}
 *		},
 *		[
 * 			[ 'typography', 'textDecoration' ],
 * 			[ 'typography', 'textTransform' ],
 *		]
 * );
 * // {}
 * ```
 *
 * With regards to nesting of styles, infinite depth is supported:
 *
 * ```
 * omitStyle(
 * 		{
 * 			border: {
 * 				radius: {
 * 					topLeft: '10px',
 * 					topRight: '0.5rem',
 * 				}
 * 			}
 *		},
 *		[
 * 			[ 'border', 'radius', 'topRight' ],
 *		]
 * );
 * // { border: { radius: { topLeft: '10px' } } }
 * ```
 *
 * The third argument, `preserveReference`, defines how to treat the input style object.
 * It is mostly necessary to properly handle mutation when recursively handling the style object.
 * Defaulting to `false`, this will always create a new object, avoiding to mutate `style`.
 * However, when recursing, we change that value to `true` in order to work with a single copy
 * of the original style object.
 *
 * @see https://lodash.com/docs/4.17.15#omit
 *
 * @param style             Styles object.
 * @param paths             Paths to remove.
 * @param preserveReference True to mutate the `style` object, false otherwise.
 * @return Styles object with the specified paths removed.
 */
export function omitStyle< T extends BlockStyle | null | undefined >(
	style: T,
	paths: string | Array< string | string[] >,
	preserveReference: boolean = false
): T {
	if ( ! style ) {
		return style;
	}

	// The early return leaves a style object.
	let newStyle = style as BlockStyle;
	if ( ! preserveReference ) {
		newStyle = JSON.parse( JSON.stringify( style ) );
	}

	if ( ! Array.isArray( paths ) ) {
		paths = [ paths ];
	}

	paths.forEach( ( path ) => {
		if ( ! Array.isArray( path ) ) {
			path = path.split( '.' );
		}

		if ( path.length > 1 ) {
			const [ firstSubpath, ...restPath ] = path;
			// A missing subpath returns early.
			omitStyle(
				newStyle[ firstSubpath ] as BlockStyle,
				[ restPath ],
				true
			);
		} else if ( path.length === 1 ) {
			delete newStyle[ path[ 0 ] ];
		}
	} );

	// The paths are left out of the same style object.
	return newStyle as T;
}

/**
 * Override props assigned to save component to inject the CSS variables definition.
 *
 * @param props            Additional props applied to save element.
 * @param blockNameOrType  Block type.
 * @param attributes       Block attributes.
 * @param attributes.style Block style attribute.
 * @param skipPaths        An object of keys and paths to skip serialization.
 *
 * @return Filtered props applied to save element.
 */
export function addSaveProps(
	props: BlockWrapperProps,
	blockNameOrType: BlockType | string,
	attributes: { style?: PanelStyle },
	skipPaths: Record< string, string[] > = skipSerializationPathsSave
): BlockWrapperProps {
	if ( ! hasStyleSupport( blockNameOrType ) ) {
		return props;
	}

	let { style } = attributes;
	Object.entries( skipPaths ).forEach( ( [ indicator, path ] ) => {
		const skipSerialization: unknown =
			skipSerializationPathsSaveChecks[ indicator ] ||
			getBlockSupport( blockNameOrType, indicator );

		if ( skipSerialization === true ) {
			style = omitStyle( style, path );
		}

		if ( Array.isArray( skipSerialization ) ) {
			skipSerialization.forEach( ( featureName: string ) => {
				const feature = renamedFeatures[ featureName ] || featureName;
				style = omitStyle( style, [ [ ...path, feature ] ] );
			} );
		}
	} );

	props.style = {
		...getInlineStyles( style ),
		...props.style,
	};

	return props;
}

function BlockStyleControls( {
	clientId,
	name,
	setAttributes,
	style,
	__unstableParentLayout,
}: BlockStyleControlsProps ) {
	const settings = useBlockSettings( name, __unstableParentLayout );
	const blockEditingMode = useBlockEditingMode();
	const { globalBlockStyles, selectedState, showStateOnCanvas } = useSelect(
		( select ) => {
			const blockEditorSelect = select( blockEditorStore );
			const {
				getSelectedBlockStyleState,
				isSelectedBlockStyleStateShownOnCanvas,
			} = unlock( blockEditorSelect );
			const editorSettings = blockEditorSelect.getSettings();
			return {
				// The global styles data holds the styles of each block type.
				globalBlockStyles: (
					editorSettings as {
						[ globalStylesDataKey ]?: {
							blocks?: Record< string, PanelStyle >;
						};
					}
				 )?.[ globalStylesDataKey ]?.blocks?.[ name ],
				selectedState: getSelectedBlockStyleState( clientId ),
				showStateOnCanvas:
					isSelectedBlockStyleStateShownOnCanvas( clientId ),
			};
		},
		[ clientId, name ]
	);
	const isPseudoSelectorState = hasPseudoBlockStyleState( selectedState );

	// Inject state styles onto the editor canvas so the selected state is
	// visible while editing. Scoped to this block instance via data-block so
	// other blocks of the same type are not affected. Must be called before
	// any early returns because it is a hook.
	const canvasStateCSS = useMemo( () => {
		if ( ! showStateOnCanvas || ! isPseudoSelectorState ) {
			return undefined;
		}

		const globalStateValue = getCanvasStateStyleValue(
			globalBlockStyles,
			selectedState
		);
		const instanceStateValue = getCanvasStateStyleValue(
			style,
			selectedState
		);
		let stateValue: PanelStyle;

		if ( globalStateValue && instanceStateValue ) {
			// Merging deeply works the same for block styles.
			stateValue = mergeGlobalStyles(
				globalStateValue as GlobalStylesConfig,
				instanceStateValue as GlobalStylesConfig
			) as PanelStyle;
		} else if ( instanceStateValue ) {
			stateValue = instanceStateValue;
		} else if ( globalStateValue ) {
			stateValue = globalStateValue;
		} else {
			return undefined;
		}

		return getBlockStateStylesCSS( stateValue, {
			name,
			baseSelector: `[data-block="${ clientId }"]`,
			baseStyle: getRootStateStyles( style, [
				'elements',
				...( VALID_BLOCK_PSEUDO_STATES[ name ] ?? [] ),
			] ),
		} );
	}, [
		showStateOnCanvas,
		isPseudoSelectorState,
		globalBlockStyles,
		style,
		selectedState,
		clientId,
		name,
	] );
	useStyleOverride( { css: canvasStateCSS } );

	if ( blockEditingMode !== 'default' ) {
		return null;
	}

	const panelSettings = {
		...settings,
		typography: {
			...settings.typography,
			// The text alignment UI for individual blocks is rendered in
			// the block toolbar, so disable it here.
			textAlign: false,
		},
	};

	const passedProps = {
		clientId,
		name,
		setAttributes,
		settings: panelSettings,
	};

	return (
		<BlockStyleStateProvider value={ selectedState }>
			<ElementsEdit { ...passedProps } />
			<BackgroundImagePanel { ...passedProps } />
			<TypographyPanel { ...passedProps } />
			<BorderPanel { ...passedProps } />
			<DimensionsPanel { ...passedProps } />
		</BlockStyleStateProvider>
	);
}

export default {
	edit: BlockStyleControls,
	hasSupport: hasStyleSupport,
	addSaveProps,
	attributeKeys: [ 'style' ],
	useBlockProps,
};

// Defines which element types are supported, including their hover styles or
// any other elements that have been included under a single element type
// e.g. heading and h1-h6.
const elementTypes = [
	{ elementType: 'button' },
	{ elementType: 'link', pseudo: [ ':hover' ] },
	{
		elementType: 'heading',
		elements: [ 'h1', 'h2', 'h3', 'h4', 'h5', 'h6' ],
	},
];

// Used for generating the instance ID
const STYLE_BLOCK_PROPS_REFERENCE = {};

/**
 * Generates CSS rules for block element styles (buttons, links, headings, etc.).
 *
 * Iterates over supported element types and compiles their styles, including
 * pseudo-selectors (e.g. :hover) and related sub-elements (e.g. h1-h6 for headings),
 * into scoped CSS rule strings.
 *
 * @param blockElementStyles The block's `style.elements` object.
 * @param blockName          The block name, used for skip-serialization checks.
 * @param baseSelector       The base CSS selector to scope rules under.
 * @return Concatenated CSS rules string, or undefined if none.
 */
function getElementCSSRules(
	blockElementStyles: Record< string, PanelStyle > | undefined,
	blockName: string,
	baseSelector: string
) {
	if ( ! blockElementStyles ) {
		return;
	}

	const rules: string[] = [];

	elementTypes.forEach( ( { elementType, pseudo, elements } ) => {
		const skipSerialization = shouldSkipSerialization(
			blockName,
			COLOR_SUPPORT_KEY,
			elementType
		);

		if ( skipSerialization ) {
			return;
		}

		const elementStyles = blockElementStyles?.[ elementType ];

		// Process primary element type styles.
		if ( elementStyles ) {
			const selector = scopeSelector(
				baseSelector,
				ELEMENTS[ elementType ]
			);

			// The element styles have the shape the style engine reads.
			rules.push( compileCSS( elementStyles as Style, { selector } ) );

			// Process any interactive states for the element type.
			if ( pseudo ) {
				pseudo.forEach( ( pseudoSelector ) => {
					// The pseudo selectors start with a colon.
					const pseudoStyles =
						elementStyles[ pseudoSelector as `:${ string }` ];
					if ( pseudoStyles ) {
						rules.push(
							// The element styles have the shape the style engine reads.
							compileCSS( pseudoStyles as Style, {
								selector: scopeSelector(
									baseSelector,
									`${ ELEMENTS[ elementType ] }${ pseudoSelector }`
								),
							} )
						);
					}
				} );
			}
		}

		// Process related elements e.g. h1-h6 for headings
		if ( elements ) {
			elements.forEach( ( element ) => {
				if ( blockElementStyles[ element ] ) {
					rules.push(
						// The element styles have the shape the style engine reads.
						compileCSS( blockElementStyles[ element ] as Style, {
							selector: scopeSelector(
								baseSelector,
								ELEMENTS[ element ]
							),
						} )
					);
				}
			} );
		}
	} );

	return rules.length > 0 ? rules.join( '' ) : undefined;
}

function useBlockProps( {
	clientId,
	name,
	style,
}: {
	clientId: string;
	name: string;
	style?: PanelStyle;
} ) {
	const blockElementsContainerIdentifier = useInstanceId(
		STYLE_BLOCK_PROPS_REFERENCE,
		'wp-elements'
	);

	const baseElementSelector = `.${ blockElementsContainerIdentifier }`;
	const blockElementStyles = style?.elements;
	const [ viewportSettings ] = useSettings( 'viewport' );

	const styles = useMemo( () => {
		const cssRules: string[] = [];

		const elementCSS = getElementCSSRules(
			blockElementStyles,
			name,
			baseElementSelector
		);
		if ( elementCSS ) {
			cssRules.push( elementCSS );
		}

		cssRules.push(
			...getPseudoStateCSSRules(
				style,
				name,
				baseElementSelector,
				getRootStateStyles( style, [
					'elements',
					...( VALID_BLOCK_PSEUDO_STATES[ name ] ?? [] ),
				] )
			)
		);

		cssRules.push(
			...getResponsiveStateCSSRules(
				style,
				name,
				baseElementSelector,
				viewportSettings
			)
		);

		return cssRules.length > 0 ? cssRules.join( '' ) : undefined;
	}, [
		baseElementSelector,
		blockElementStyles,
		name,
		style,
		viewportSettings,
	] );

	usePrivateStyleOverride( { css: styles, clientId } );

	return addSaveProps(
		{ className: blockElementsContainerIdentifier },
		name,
		{ style },
		skipSerializationPathsEdit
	);
}

addFilter(
	'blocks.registerBlockType',
	'core/style/addAttribute',
	addAttribute
);
