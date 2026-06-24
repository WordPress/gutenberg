/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';
import { addFilter } from '@wordpress/hooks';
import { useSelect } from '@wordpress/data';
import { mergeGlobalStyles } from '@wordpress/global-styles-engine';
import {
	getBlockSupport,
	getBlockType,
	hasBlockSupport,
	__EXPERIMENTAL_ELEMENTS as ELEMENTS,
} from '@wordpress/blocks';
import { useInstanceId } from '@wordpress/compose';
import { getCSSRules, compileCSS } from '@wordpress/style-engine';

/**
 * Internal dependencies
 */
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
import { store as blockEditorStore } from '../store';
import { globalStylesDataKey } from '../store/private-keys';
import { unlock } from '../lock-unlock';

const BORDER_SIDES = [ 'Top', 'Right', 'Bottom', 'Left' ];

// Keep in sync with WP_Theme_JSON_Gutenberg::RESPONSIVE_BREAKPOINTS and
// packages/global-styles-engine/src/core/render.tsx.
const RESPONSIVE_BREAKPOINTS = {
	'@mobile': '@media (width <= 480px)',
	'@tablet': '@media (480px < width <= 782px)',
};

const styleSupportKeys = [
	...TYPOGRAPHY_SUPPORT_KEYS,
	BORDER_SUPPORT_KEY,
	COLOR_SUPPORT_KEY,
	DIMENSIONS_SUPPORT_KEY,
	BACKGROUND_SUPPORT_KEY,
	SPACING_SUPPORT_KEY,
	SHADOW_SUPPORT_KEY,
];

const hasStyleSupport = ( nameOrType ) =>
	styleSupportKeys.some( ( key ) => hasBlockSupport( nameOrType, key ) );

/**
 * Returns the inline styles to add depending on the style object
 *
 * @param {Object} styles Styles configuration.
 *
 * @return {Object} Flattened CSS variables declaration.
 */
export function getInlineStyles( styles = {} ) {
	const output = {};
	// The goal is to move everything to server side generated engine styles
	// This is temporary as we absorb more and more styles into the engine.
	getCSSRules( styles ).forEach( ( rule ) => {
		output[ rule.key ] = rule.value;
	} );

	return output;
}

/**
 * Returns fallback border styles for visible state border styles.
 *
 * State styles are emitted as stylesheet rules rather than inline styles, so
 * they cannot rely on the block-library inline-style attribute fallback rules.
 *
 * @param {Object} stateStyles State style object.
 * @return {Object|undefined} Style object containing fallback border styles.
 */
function getStateFallbackBorderStyles( stateStyles ) {
	const border = stateStyles?.border;
	if ( ! border ) {
		return undefined;
	}

	const hasBorderStyle = !! border.style;
	const hasBorderColor = !! border.color;
	const hasBorderWidth = !! border.width;
	const fallbackBorder = {};

	if ( ! hasBorderStyle && ( hasBorderColor || hasBorderWidth ) ) {
		fallbackBorder.style = 'solid';
	}

	BORDER_SIDES.forEach( ( side ) => {
		const sideKey = side.toLowerCase();
		const sideBorder = border[ sideKey ];
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
 * @param {Object} stateStyles State style object.
 * @param {string} selector    CSS selector for the generated style.
 * @return {string|undefined} CSS string with background-image reset, or undefined.
 */
function getStateBackgroundResetCSS( stateStyles, selector ) {
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
 * Returns fallback dimension styles that keep state styles aligned with the
 * default dimensions block-support output.
 *
 * @param {Object} stateStyles State style object.
 * @return {Object|undefined} Style object containing fallback dimension styles.
 */
function getStateFallbackDimensionStyles( stateStyles ) {
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
}

/**
 * Generates CSS for a block instance state style object.
 *
 * State declarations need to win over preset utility classes, but fallback
 * border styles should not become important because they must not override
 * explicitly authored default border styles.
 *
 * @param {Object} stateStyles State style object.
 * @param {string} selector    CSS selector for the generated style.
 * @return {string} Generated stylesheet.
 */
export function getStateStylesCSS( stateStyles, selector ) {
	const fallbackDimensionStyles =
		getStateFallbackDimensionStyles( stateStyles );
	const stylesWithDimensionFallbacks = fallbackDimensionStyles
		? mergeStyleObjects( stateStyles, fallbackDimensionStyles )
		: stateStyles;
	const css = compileCSS( stylesWithDimensionFallbacks, { selector } );
	const importantCSS = css ? css.replace( /;/g, ' !important;' ) : undefined;
	const fallbackBorderStyles = getStateFallbackBorderStyles( stateStyles );
	const fallbackCSS = fallbackBorderStyles
		? compileCSS( fallbackBorderStyles, { selector } )
		: undefined;
	const backgroundResetCSS = getStateBackgroundResetCSS(
		stateStyles,
		selector
	);

	return [ importantCSS, fallbackCSS, backgroundResetCSS ]
		.filter( Boolean )
		.join( '\n' );
}

function isPlainObject( value ) {
	return !! value && typeof value === 'object' && ! Array.isArray( value );
}

function mergeStyleObjects( target = {}, source = {} ) {
	const merged = { ...target };

	Object.entries( source ).forEach( ( [ key, value ] ) => {
		merged[ key ] =
			isPlainObject( value ) && isPlainObject( merged[ key ] )
				? mergeStyleObjects( merged[ key ], value )
				: value;
	} );

	return merged;
}

function addStyleGroup( groups, selector, style ) {
	const key = selector || '';
	const existing = groups.get( key ) || { selector, style: {} };

	groups.set( key, {
		selector,
		style: mergeStyleObjects( existing.style, style ),
	} );
}

function getStateStyleGroups( stateStyles, name ) {
	const blockSelectors = getBlockType( name )?.selectors || {};
	const groups = new Map();

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
						featureSelectors.root || blockSelectors.root,
						{
							[ feature ]: remainingStyles,
						}
					);
				}
				return;
			}

			addStyleGroup( groups, blockSelectors.root, {
				[ feature ]: featureStyles,
			} );
		}
	);

	return Array.from( groups.values() );
}

/**
 * Generates CSS for block instance state styles, honoring feature selectors.
 *
 * @param {Object}  stateStyles          State style object.
 * @param {Object}  options              Generation options.
 * @param {string}  options.name         Block name.
 * @param {string}  options.baseSelector Block-instance scoping selector.
 * @param {string=} options.state        Optional pseudo-state, e.g. ":hover".
 * @return {string|undefined} Generated stylesheet.
 */
export function getBlockStateStylesCSS( stateStyles, options ) {
	const { name, baseSelector, state = '' } = options;
	const rules = getStateStyleGroups( stateStyles, name )
		.map( ( { selector: blockSelector, style } ) =>
			getStateStylesCSS(
				style,
				buildScopedBlockSelector( baseSelector, blockSelector, state )
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
 * @param {Object}   stateStyles Style object for a selected state.
 * @param {string[]} nestedKeys  Keys to remove from the root style object.
 * @return {Object|undefined} Root-only style object.
 */
function getRootStateStyles( stateStyles, nestedKeys ) {
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
 * @param {Object} style        Block style object containing pseudo-state styles.
 * @param {string} name         Block name.
 * @param {string} baseSelector Base selector used to scope generated CSS.
 * @return {string[]} Generated CSS rule strings.
 */
function getPseudoStateCSSRules( style, name, baseSelector ) {
	const validPseudoStates = VALID_BLOCK_PSEUDO_STATES[ name ];
	if ( ! validPseudoStates ) {
		return [];
	}

	const cssRules = [];
	validPseudoStates.forEach( ( pseudoState ) => {
		const stateStyles = style?.[ pseudoState ];
		if ( stateStyles ) {
			const css = getBlockStateStylesCSS( stateStyles, {
				name,
				baseSelector,
				state: pseudoState,
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
 * @param {Object} style        Block style object containing responsive states.
 * @param {string} name         Block name.
 * @param {string} baseSelector Base selector used to scope generated CSS.
 * @return {string[]} Generated CSS rule strings.
 */
export function getResponsiveStateCSSRules( style, name, baseSelector ) {
	const cssRules = [];
	const validPseudoStates = VALID_BLOCK_PSEUDO_STATES[ name ] ?? [];
	const nestedStateKeys = [ 'elements', ...validPseudoStates ];

	Object.entries( RESPONSIVE_BREAKPOINTS ).forEach(
		( [ viewport, mediaQuery ] ) => {
			const viewportStyles = getStyleForState( style, {
				viewport,
				pseudo: DEFAULT_BLOCK_STYLE_STATE.pseudo,
			} );
			if ( ! viewportStyles ) {
				return;
			}

			const viewportCSSRules = [];
			const rootCSS = getBlockStateStylesCSS(
				getRootStateStyles( viewportStyles, nestedStateKeys ),
				{
					name,
					baseSelector,
				}
			);
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
				...getPseudoStateCSSRules( viewportStyles, name, baseSelector )
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
 * @param {Object} style         Block style object.
 * @param {Object} selectedState Selected block style state.
 * @return {Object|undefined} Style value for the canvas preview.
 */
export function getCanvasStateStyleValue( style, selectedState ) {
	const stateValue = getStyleForState( style, selectedState );
	if ( ! hasViewportBlockStyleState( selectedState ) ) {
		return stateValue;
	}

	const defaultViewportState = {
		...selectedState,
		viewport: DEFAULT_BLOCK_STYLE_STATE.viewport,
	};
	const defaultViewportStateValue = getStyleForState(
		style,
		defaultViewportState
	);

	if ( defaultViewportStateValue && stateValue ) {
		return mergeGlobalStyles( defaultViewportStateValue, stateValue );
	}
	return stateValue || defaultViewportStateValue;
}

/**
 * Filters registered block settings, extending attributes to include `style` attribute.
 *
 * @param {Object} settings Original block settings.
 *
 * @return {Object} Filtered block settings.
 */
function addAttribute( settings ) {
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
 * @type {Record<string, string[]>}
 */
const skipSerializationPathsEdit = {
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
 * @type {Record<string, string[]>}
 */
const skipSerializationPathsSave = {
	...skipSerializationPathsEdit,
	[ `${ DIMENSIONS_SUPPORT_KEY }.aspectRatio` ]: [
		`${ DIMENSIONS_SUPPORT_KEY }.aspectRatio`,
	], // Skip serialization of aspect ratio in save mode.
	[ `${ BACKGROUND_SUPPORT_KEY }` ]: [ BACKGROUND_SUPPORT_KEY ], // Skip serialization of background support in save mode.
};

const skipSerializationPathsSaveChecks = {
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
 * @type {Record<string, string>}
 */
const renamedFeatures = { gradients: 'gradient' };

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
 * @param {Object}       style             Styles object.
 * @param {Array|string} paths             Paths to remove.
 * @param {boolean}      preserveReference True to mutate the `style` object, false otherwise.
 * @return {Object}      Styles object with the specified paths removed.
 */
export function omitStyle( style, paths, preserveReference = false ) {
	if ( ! style ) {
		return style;
	}

	let newStyle = style;
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
			omitStyle( newStyle[ firstSubpath ], [ restPath ], true );
		} else if ( path.length === 1 ) {
			delete newStyle[ path[ 0 ] ];
		}
	} );

	return newStyle;
}

/**
 * Override props assigned to save component to inject the CSS variables definition.
 *
 * @param {Object}                    props           Additional props applied to save element.
 * @param {Object|string}             blockNameOrType Block type.
 * @param {Object}                    attributes      Block attributes.
 * @param {?Record<string, string[]>} skipPaths       An object of keys and paths to skip serialization.
 *
 * @return {Object} Filtered props applied to save element.
 */
export function addSaveProps(
	props,
	blockNameOrType,
	attributes,
	skipPaths = skipSerializationPathsSave
) {
	if ( ! hasStyleSupport( blockNameOrType ) ) {
		return props;
	}

	let { style } = attributes;
	Object.entries( skipPaths ).forEach( ( [ indicator, path ] ) => {
		const skipSerialization =
			skipSerializationPathsSaveChecks[ indicator ] ||
			getBlockSupport( blockNameOrType, indicator );

		if ( skipSerialization === true ) {
			style = omitStyle( style, path );
		}

		if ( Array.isArray( skipSerialization ) ) {
			skipSerialization.forEach( ( featureName ) => {
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
} ) {
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
				globalBlockStyles:
					editorSettings?.[ globalStylesDataKey ]?.blocks?.[ name ],
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
		let stateValue;

		if ( globalStateValue && instanceStateValue ) {
			stateValue = mergeGlobalStyles(
				globalStateValue,
				instanceStateValue
			);
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
 * @param {Object} blockElementStyles The block's `style.elements` object.
 * @param {string} blockName          The block name, used for skip-serialization checks.
 * @param {string} baseSelector       The base CSS selector to scope rules under.
 * @return {string|undefined} Concatenated CSS rules string, or undefined if none.
 */
function getElementCSSRules( blockElementStyles, blockName, baseSelector ) {
	if ( ! blockElementStyles ) {
		return;
	}

	const rules = [];

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

			rules.push( compileCSS( elementStyles, { selector } ) );

			// Process any interactive states for the element type.
			if ( pseudo ) {
				pseudo.forEach( ( pseudoSelector ) => {
					if ( elementStyles[ pseudoSelector ] ) {
						rules.push(
							compileCSS( elementStyles[ pseudoSelector ], {
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
						compileCSS( blockElementStyles[ element ], {
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

function useBlockProps( { name, style } ) {
	const blockElementsContainerIdentifier = useInstanceId(
		STYLE_BLOCK_PROPS_REFERENCE,
		'wp-elements'
	);

	const baseElementSelector = `.${ blockElementsContainerIdentifier }`;
	const blockElementStyles = style?.elements;

	const styles = useMemo( () => {
		const cssRules = [];

		const elementCSS = getElementCSSRules(
			blockElementStyles,
			name,
			baseElementSelector
		);
		if ( elementCSS ) {
			cssRules.push( elementCSS );
		}

		cssRules.push(
			...getPseudoStateCSSRules( style, name, baseElementSelector )
		);

		cssRules.push(
			...getResponsiveStateCSSRules( style, name, baseElementSelector )
		);

		return cssRules.length > 0 ? cssRules.join( '' ) : undefined;
	}, [ baseElementSelector, blockElementStyles, name, style ] );

	useStyleOverride( { css: styles } );

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
