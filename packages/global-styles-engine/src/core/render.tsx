/**
 * WordPress dependencies
 */
import {
	__EXPERIMENTAL_STYLE_PROPERTY as STYLE_PROPERTY,
	__EXPERIMENTAL_ELEMENTS as ELEMENTS,
	getBlockSupport,
	getBlockTypes,
	store as blocksStore,
	// @ts-expect-error - @wordpress/blocks module doesn't have TypeScript declarations
} from '@wordpress/blocks';
import { getCSSRules, getCSSValueFromRawStyle } from '@wordpress/style-engine';
import { select } from '@wordpress/data';

/**
 * Internal dependencies
 */
import {
	PRESET_METADATA,
	ROOT_BLOCK_SELECTOR,
	ROOT_CSS_PROPERTIES_SELECTOR,
	scopeSelector,
	scopeFeatureSelectors,
	appendToSelector,
	getBlockStyleVariationSelector,
	getResolvedValue,
} from '../utils/common';
import { getBlockSelector } from './selectors';
import { getTypographyFontSizeValue } from '../utils/typography';
import { getDuotoneFilter } from '../utils/duotone';
import { kebabCase } from '../utils/string';
import { getGapCSSValue } from '../utils/gap';
import { setBackgroundStyleDefaults } from '../utils/background';
import { LAYOUT_DEFINITIONS } from '../utils/layout';
import { getValueFromObjectPath, setImmutably } from '../utils/object';
import { getSetting } from '../settings/get-setting';
import type {
	BlockStyleVariation,
	BlockType,
	GlobalStylesConfig,
	GlobalStylesSettings,
	GlobalStylesStyles,
} from '../types';

// =============================================================================
// LOCAL TYPE DEFINITIONS
// =============================================================================

/**
 * Preset metadata for CSS variable generation
 */
interface PresetMetadata {
	path: string[];
	valueKey?: string;
	valueFunc?: ( preset: any, settings: any ) => string | number | null;
	cssVarInfix: string;
	classes?: Array< {
		classSuffix: string;
		propertyName: string;
	} >;
}

/**
 * Preset collection by origin
 */
interface PresetsByOrigin {
	[ origin: string ]: any[];
}

/**
 * CSS class configuration
 */
interface CSSClassConfig {
	classSuffix: string;
	propertyName: string;
}

/**
 * Style property configuration from WordPress
 */
interface StylePropertyConfig {
	value: string[];
	properties?: Record< string, string >;
	useEngine?: boolean;
	rootOnly?: boolean;
}

/**
 * Layout definition structure
 */
interface LayoutDefinition {
	className: string;
	name: string;
	displayMode?: string;
	spacingStyles?: Array< {
		selector?: string;
		rules?: Record< string, any >;
	} >;
	baseStyles?: Array< {
		selector?: string;
		rules?: Record< string, any >;
	} >;
}

/**
 * CSS rule from style engine
 */
interface CSSRule {
	key: string;
	value: any;
}

/**
 * Block variation in theme.json (different from BlockStyleVariation)
 */
interface BlockVariation {
	css?: string;
	elements?: Record< string, any >;
	blocks?: Record< string, any >;
	[ key: string ]: any; // For additional style properties
}

/**
 * Block node in theme.json
 */
interface BlockNode {
	variations?: Record< string, BlockVariation >;
	elements?: Record< string, any >;
	[ key: string ]: any; // For additional style properties
}

export type BlockSelectors = Record<
	string,
	{
		duotoneSelector?: string;
		selector: string;
		fallbackGapValue?: string;
		hasLayoutSupport?: boolean;
		featureSelectors?:
			| string
			| Record< string, string | Record< string, string > >;
		name?: string;
		styleVariationSelectors?: Record< string, string >;
	}
>;

// Elements that rely on class names in their selectors.
const ELEMENT_CLASS_NAMES = {
	button: 'wp-element-button',
	caption: 'wp-element-caption',
};

// List of block support features that can have their related styles
// generated under their own feature level selector rather than the block's.
const BLOCK_SUPPORT_FEATURE_LEVEL_SELECTORS = {
	__experimentalBorder: 'border',
	color: 'color',
	spacing: 'spacing',
	typography: 'typography',
};

/**
 * Transform given preset tree into a set of style declarations.
 *
 * @param blockPresets   Block presets object
 * @param mergedSettings Merged theme.json settings
 * @return An array of style declarations
 */
function getPresetsDeclarations(
	blockPresets: Record< string, any > = {},
	mergedSettings: GlobalStylesSettings
): string[] {
	return PRESET_METADATA.reduce(
		(
			declarations: string[],
			{ path, valueKey, valueFunc, cssVarInfix }: PresetMetadata
		) => {
			const presetByOrigin = getValueFromObjectPath(
				blockPresets,
				path,
				[]
			) as PresetsByOrigin;
			[ 'default', 'theme', 'custom' ].forEach( ( origin ) => {
				if ( presetByOrigin[ origin ] ) {
					presetByOrigin[ origin ].forEach( ( value: any ) => {
						if ( valueKey && ! valueFunc ) {
							declarations.push(
								`--wp--preset--${ cssVarInfix }--${ kebabCase(
									value.slug
								) }: ${ value[ valueKey ] }`
							);
						} else if (
							valueFunc &&
							typeof valueFunc === 'function'
						) {
							declarations.push(
								`--wp--preset--${ cssVarInfix }--${ kebabCase(
									value.slug
								) }: ${ valueFunc( value, mergedSettings ) }`
							);
						}
					} );
				}
			} );

			return declarations;
		},
		[] as string[]
	);
}

/**
 * Transform given preset tree into a set of preset class declarations.
 *
 * @param blockSelector Block selector string
 * @param blockPresets  Block presets object
 * @return CSS declarations for the preset classes
 */
function getPresetsClasses(
	blockSelector: string = '*',
	blockPresets: Record< string, any > = {}
): string {
	return PRESET_METADATA.reduce(
		(
			declarations: string,
			{ path, cssVarInfix, classes }: PresetMetadata
		) => {
			if ( ! classes ) {
				return declarations;
			}

			const presetByOrigin = getValueFromObjectPath(
				blockPresets,
				path,
				[]
			) as PresetsByOrigin;
			[ 'default', 'theme', 'custom' ].forEach( ( origin ) => {
				if ( presetByOrigin[ origin ] ) {
					presetByOrigin[ origin ].forEach(
						( { slug }: { slug: string } ) => {
							classes!.forEach(
								( {
									classSuffix,
									propertyName,
								}: CSSClassConfig ) => {
									const classSelectorToUse = `.has-${ kebabCase(
										slug
									) }-${ classSuffix }`;
									const selectorToUse = blockSelector
										.split( ',' ) // Selector can be "h1, h2, h3"
										.map(
											( selector ) =>
												`${ selector }${ classSelectorToUse }`
										)
										.join( ',' );
									const value = `var(--wp--preset--${ cssVarInfix }--${ kebabCase(
										slug
									) })`;
									declarations += `${ selectorToUse }{${ propertyName }: ${ value } !important;}`;
								}
							);
						}
					);
				}
			} );
			return declarations;
		},
		''
	);
}

function getPresetsSvgFilters(
	blockPresets: Record< string, any > = {}
): string[] {
	return PRESET_METADATA.filter(
		// Duotone are the only type of filters for now.
		( metadata: PresetMetadata ) => metadata.path.at( -1 ) === 'duotone'
	).flatMap( ( metadata: PresetMetadata ) => {
		const presetByOrigin = getValueFromObjectPath(
			blockPresets,
			metadata.path,
			{}
		) as PresetsByOrigin;
		return [ 'default', 'theme' ]
			.filter( ( origin ) => presetByOrigin[ origin ] )
			.flatMap( ( origin ) =>
				presetByOrigin[ origin ].map( ( preset: any ) =>
					getDuotoneFilter(
						`wp-duotone-${ preset.slug }`,
						preset.colors
					)
				)
			)
			.join( '' );
	} );
}

function flattenTree(
	input: any = {},
	prefix: string,
	token: string
): string[] {
	let result: string[] = [];
	Object.keys( input ).forEach( ( key ) => {
		const newKey = prefix + kebabCase( key.replace( '/', '-' ) );
		const newLeaf = input[ key ];

		if ( newLeaf instanceof Object ) {
			const newPrefix = newKey + token;
			result = [ ...result, ...flattenTree( newLeaf, newPrefix, token ) ];
		} else {
			result.push( `${ newKey }: ${ newLeaf }` );
		}
	} );
	return result;
}

/**
 * Gets variation selector string from feature selector.
 *
 * @param featureSelector        The feature selector
 * @param styleVariationSelector The style variation selector
 * @return Combined selector string
 */
function concatFeatureVariationSelectorString(
	featureSelector: string,
	styleVariationSelector: string
): string {
	const featureSelectors = featureSelector.split( ',' );
	const combinedSelectors: string[] = [];
	featureSelectors.forEach( ( selector ) => {
		combinedSelectors.push(
			`${ styleVariationSelector.trim() }${ selector.trim() }`
		);
	} );
	return combinedSelectors.join( ', ' );
}

/**
 * Generate style declarations for a block's custom feature and subfeature
 * selectors.
 *
 * NOTE: The passed `styles` object will be mutated by this function.
 *
 * @param selectors Custom selectors object for a block
 * @param styles    A block's styles object
 * @return Style declarations
 */
const getFeatureDeclarations = (
	selectors: Record< string, any >,
	styles: Record< string, any >
): Record< string, string[] > => {
	const declarations: Record< string, string[] > = {};

	Object.entries( selectors ).forEach( ( [ feature, selector ] ) => {
		// We're only processing features/subfeatures that have styles.
		if ( feature === 'root' || ! styles?.[ feature ] ) {
			return;
		}

		const isShorthand = typeof selector === 'string';

		// If we have a selector object instead of shorthand process it.
		if (
			! isShorthand &&
			typeof selector === 'object' &&
			selector !== null
		) {
			Object.entries( selector as Record< string, string > ).forEach(
				( [ subfeature, subfeatureSelector ] ) => {
					// Don't process root feature selector yet or any
					// subfeature that doesn't have a style.
					if (
						subfeature === 'root' ||
						! styles?.[ feature ][ subfeature ]
					) {
						return;
					}

					// Create a temporary styles object and build
					// declarations for subfeature.
					const subfeatureStyles = {
						[ feature ]: {
							[ subfeature ]: styles[ feature ][ subfeature ],
						},
					};
					const newDeclarations =
						getStylesDeclarations( subfeatureStyles );

					// Merge new declarations in with any others that
					// share the same selector.
					declarations[ subfeatureSelector ] = [
						...( declarations[ subfeatureSelector ] || [] ),
						...newDeclarations,
					];

					// Remove the subfeature's style now it will be
					// included under its own selector not the block's.
					delete styles[ feature ][ subfeature ];
				}
			);
		}

		// Now subfeatures have been processed and removed, we can
		// process root, or shorthand, feature selectors.
		if (
			isShorthand ||
			( typeof selector === 'object' &&
				selector !== null &&
				'root' in selector )
		) {
			const featureSelector = isShorthand
				? ( selector as string )
				: ( selector as any ).root;

			// Create temporary style object and build declarations for feature.
			const featureStyles = { [ feature ]: styles[ feature ] };
			const newDeclarations = getStylesDeclarations( featureStyles );

			// Merge new declarations with any others that share the selector.
			declarations[ featureSelector ] = [
				...( declarations[ featureSelector ] || [] ),
				...newDeclarations,
			];

			// Remove the feature from the block's styles now as it will be
			// included under its own selector not the block's.
			delete styles[ feature ];
		}
	} );

	return declarations;
};

/**
 * Transform given style tree into a set of style declarations.
 *
 * @param blockStyles         Block styles
 * @param selector            The selector these declarations should attach to
 * @param useRootPaddingAlign Whether to use CSS custom properties in root selector
 * @param tree                A theme.json tree containing layout definitions
 * @param disableRootPadding  Whether to force disable the root padding styles
 * @return An array of style declarations
 */
export function getStylesDeclarations(
	blockStyles: any = {},
	selector: string = '',
	useRootPaddingAlign?: boolean,
	tree: any = {},
	disableRootPadding: boolean = false
): string[] {
	const isRoot = ROOT_BLOCK_SELECTOR === selector;
	const output = Object.entries(
		STYLE_PROPERTY as Record< string, StylePropertyConfig >
	).reduce(
		(
			declarations: string[],
			[ key, { value, properties, useEngine, rootOnly } ]: [
				string,
				StylePropertyConfig,
			]
		) => {
			if ( rootOnly && ! isRoot ) {
				return declarations;
			}
			const pathToValue = value;
			if ( pathToValue[ 0 ] === 'elements' || useEngine ) {
				return declarations;
			}

			const styleValue = getValueFromObjectPath(
				blockStyles,
				pathToValue
			);

			// Root-level padding styles don't currently support strings with CSS shorthand values.
			// This may change: https://github.com/WordPress/gutenberg/issues/40132.
			if (
				key === '--wp--style--root--padding' &&
				( typeof styleValue === 'string' || ! useRootPaddingAlign )
			) {
				return declarations;
			}

			if ( properties && typeof styleValue !== 'string' ) {
				Object.entries( properties ).forEach( ( entry ) => {
					const [ name, prop ] = entry;

					if (
						! getValueFromObjectPath( styleValue, [ prop ], false )
					) {
						// Do not create a declaration
						// for sub-properties that don't have any value.
						return;
					}

					const cssProperty = name.startsWith( '--' )
						? name
						: kebabCase( name );
					declarations.push(
						`${ cssProperty }: ${ getCSSValueFromRawStyle(
							getValueFromObjectPath( styleValue, [ prop ] )
						) }`
					);
				} );
			} else if (
				getValueFromObjectPath( blockStyles, pathToValue, false )
			) {
				const cssProperty = key.startsWith( '--' )
					? key
					: kebabCase( key );
				declarations.push(
					`${ cssProperty }: ${ getCSSValueFromRawStyle(
						getValueFromObjectPath( blockStyles, pathToValue )
					) }`
				);
			}

			return declarations;
		},
		[] as string[]
	);

	/*
	 * Preprocess background image values.
	 *
	 * Note: As we absorb more and more styles into the engine, we could simplify this function.
	 * A refactor is for the style engine to handle ref resolution (and possibly defaults)
	 * via a public util used internally and externally. Theme.json tree and defaults could be passed
	 * as options.
	 */
	if ( !! blockStyles.background ) {
		/*
		 * Resolve dynamic values before they are compiled by the style engine,
		 * which doesn't (yet) resolve dynamic values.
		 */
		if ( blockStyles.background?.backgroundImage ) {
			blockStyles.background.backgroundImage = getResolvedValue(
				blockStyles.background.backgroundImage,
				tree
			);
		}

		/*
		 * Set default values for block background styles.
		 * Top-level styles are an exception as they are applied to the body.
		 */
		if ( ! isRoot && !! blockStyles.background?.backgroundImage?.id ) {
			blockStyles = {
				...blockStyles,
				background: {
					...blockStyles.background,
					...setBackgroundStyleDefaults( blockStyles.background ),
				},
			};
		}
	}

	const extraRules = getCSSRules( blockStyles );
	extraRules.forEach( ( rule: CSSRule ) => {
		// Don't output padding properties if padding variables are set or if we're not editing a full template.
		if (
			isRoot &&
			( useRootPaddingAlign || disableRootPadding ) &&
			rule.key.startsWith( 'padding' )
		) {
			return;
		}
		const cssProperty = rule.key.startsWith( '--' )
			? rule.key
			: kebabCase( rule.key );

		let ruleValue = getResolvedValue( rule.value, tree );

		// Calculate fluid typography rules where available.
		if ( cssProperty === 'font-size' ) {
			/*
			 * getTypographyFontSizeValue() will check
			 * if fluid typography has been activated and also
			 * whether the incoming value can be converted to a fluid value.
			 * Values that already have a "clamp()" function will not pass the test,
			 * and therefore the original $value will be returned.
			 */
			ruleValue = getTypographyFontSizeValue(
				{ name: '', slug: '', size: ruleValue as string },
				tree?.settings
			);
		}

		// For aspect ratio to work, other dimensions rules (and Cover block defaults) must be unset.
		// This ensures that a fixed height does not override the aspect ratio.
		if ( cssProperty === 'aspect-ratio' ) {
			output.push( 'min-height: unset' );
		}

		output.push( `${ cssProperty }: ${ ruleValue }` );
	} );

	return output;
}

/**
 * Get generated CSS for layout styles by looking up layout definitions provided
 * in theme.json, and outputting common layout styles, and specific blockGap values.
 *
 * @param props                       Layout styles configuration
 * @param props.layoutDefinitions     Layout definitions from theme.json
 * @param props.style                 Style object for the block
 * @param props.selector              Selector to apply the styles to
 * @param props.hasBlockGapSupport    Whether the block supports block gap styles
 * @param props.hasFallbackGapSupport Whether the block supports fallback gap styles
 * @param props.fallbackGapValue      Fallback gap value to use if block gap support is
 *
 * @return Generated CSS rules for the layout styles
 */
export function getLayoutStyles( {
	layoutDefinitions = LAYOUT_DEFINITIONS,
	style,
	selector,
	hasBlockGapSupport,
	hasFallbackGapSupport,
	fallbackGapValue,
}: {
	layoutDefinitions?: Record< string, LayoutDefinition >;
	style?: GlobalStylesStyles;
	selector?: string;
	hasBlockGapSupport?: boolean;
	hasFallbackGapSupport?: boolean;
	fallbackGapValue?: string;
} ): string {
	let ruleset = '';
	let gapValue = hasBlockGapSupport
		? getGapCSSValue( style?.spacing?.blockGap )
		: '';

	// Ensure a fallback gap value for the root layout definitions,
	// and use a fallback value if one is provided for the current block.
	if ( hasFallbackGapSupport ) {
		if ( selector === ROOT_BLOCK_SELECTOR ) {
			gapValue = ! gapValue ? '0.5em' : gapValue;
		} else if ( ! hasBlockGapSupport && fallbackGapValue ) {
			gapValue = fallbackGapValue;
		}
	}

	if ( gapValue && layoutDefinitions ) {
		Object.values( layoutDefinitions ).forEach(
			( { className, name, spacingStyles } ) => {
				// Allow outputting fallback gap styles for flex layout type when block gap support isn't available.
				if (
					! hasBlockGapSupport &&
					'flex' !== name &&
					'grid' !== name
				) {
					return;
				}

				if ( spacingStyles?.length ) {
					spacingStyles.forEach( ( spacingStyle: any ) => {
						const declarations: string[] = [];

						if ( spacingStyle.rules ) {
							Object.entries( spacingStyle.rules ).forEach(
								( [ cssProperty, cssValue ] ) => {
									declarations.push(
										`${ cssProperty }: ${
											cssValue ? cssValue : gapValue
										}`
									);
								}
							);
						}

						if ( declarations.length ) {
							let combinedSelector = '';

							if ( ! hasBlockGapSupport ) {
								// For fallback gap styles, use lower specificity, to ensure styles do not unintentionally override theme styles.
								combinedSelector =
									selector === ROOT_BLOCK_SELECTOR
										? `:where(.${ className }${
												spacingStyle?.selector || ''
										  })`
										: `:where(${ selector }.${ className }${
												spacingStyle?.selector || ''
										  })`;
							} else {
								combinedSelector =
									selector === ROOT_BLOCK_SELECTOR
										? `:root :where(.${ className })${
												spacingStyle?.selector || ''
										  }`
										: `:root :where(${ selector }-${ className })${
												spacingStyle?.selector || ''
										  }`;
							}
							ruleset += `${ combinedSelector } { ${ declarations.join(
								'; '
							) }; }`;
						}
					} );
				}
			}
		);
		// For backwards compatibility, ensure the legacy block gap CSS variable is still available.
		if ( selector === ROOT_BLOCK_SELECTOR && hasBlockGapSupport ) {
			ruleset += `${ ROOT_CSS_PROPERTIES_SELECTOR } { --wp--style--block-gap: ${ gapValue }; }`;
		}
	}

	// Output base styles
	if ( selector === ROOT_BLOCK_SELECTOR && layoutDefinitions ) {
		const validDisplayModes = [ 'block', 'flex', 'grid' ];
		Object.values( layoutDefinitions ).forEach(
			( { className, displayMode, baseStyles }: LayoutDefinition ) => {
				if (
					displayMode &&
					validDisplayModes.includes( displayMode )
				) {
					ruleset += `${ selector } .${ className } { display:${ displayMode }; }`;
				}

				if ( baseStyles?.length ) {
					baseStyles.forEach( ( baseStyle: any ) => {
						const declarations: string[] = [];

						if ( baseStyle.rules ) {
							Object.entries( baseStyle.rules ).forEach(
								( [ cssProperty, cssValue ] ) => {
									declarations.push(
										`${ cssProperty }: ${ cssValue }`
									);
								}
							);
						}

						if ( declarations.length ) {
							const combinedSelector = `.${ className }${
								baseStyle?.selector || ''
							}`;
							ruleset += `${ combinedSelector } { ${ declarations.join(
								'; '
							) }; }`;
						}
					} );
				}
			}
		);
	}

	return ruleset;
}

const STYLE_KEYS = [
	'border',
	'color',
	'dimensions',
	'spacing',
	'typography',
	'filter',
	'outline',
	'shadow',
	'background',
];

function pickStyleKeys( treeToPickFrom: any ): any {
	if ( ! treeToPickFrom ) {
		return {};
	}
	const entries = Object.entries( treeToPickFrom );
	const pickedEntries = entries.filter( ( [ key ] ) =>
		STYLE_KEYS.includes( key )
	);
	// clone the style objects so that `getFeatureDeclarations` can remove consumed keys from it
	const clonedEntries = pickedEntries.map( ( [ key, style ] ) => [
		key,
		JSON.parse( JSON.stringify( style ) ),
	] );
	return Object.fromEntries( clonedEntries );
}

export const getNodesWithStyles = (
	tree: GlobalStylesConfig,
	blockSelectors: string | BlockSelectors
): any[] => {
	const nodes: {
		styles: Partial< Omit< GlobalStylesStyles, 'elements' | 'blocks' > >;
		selector: string;
		skipSelectorWrapper?: boolean;
		duotoneSelector?: string;
		featureSelectors?:
			| string
			| Record< string, string | Record< string, string > >;
		fallbackGapValue?: string;
		hasLayoutSupport?: boolean;
		styleVariationSelectors?: Record< string, string >;
	}[] = [];

	if ( ! tree?.styles ) {
		return nodes;
	}

	// Top-level.
	const styles = pickStyleKeys( tree.styles );
	if ( styles ) {
		nodes.push( {
			styles,
			selector: ROOT_BLOCK_SELECTOR,
			// Root selector (body) styles should not be wrapped in `:root where()` to keep
			// specificity at (0,0,1) and maintain backwards compatibility.
			skipSelectorWrapper: true,
		} );
	}

	Object.entries( ELEMENTS ).forEach( ( [ name, selector ] ) => {
		if ( tree.styles?.elements?.[ name ] ) {
			nodes.push( {
				styles: tree.styles?.elements?.[ name ] ?? {},
				selector: selector as string,
				// Top level elements that don't use a class name should not receive the
				// `:root :where()` wrapper to maintain backwards compatibility.
				skipSelectorWrapper: ! (
					ELEMENT_CLASS_NAMES as Record< string, string >
				 )[ name ],
			} );
		}
	} );

	// Iterate over blocks: they can have styles & elements.
	Object.entries( tree.styles?.blocks ?? {} ).forEach(
		( [ blockName, node ] ) => {
			const blockStyles = pickStyleKeys( node );
			const typedNode = node as BlockNode;

			if ( typedNode?.variations ) {
				const variations: Record< string, any > = {};
				Object.entries( typedNode.variations ).forEach(
					( [ variationName, variation ] ) => {
						const typedVariation = variation as BlockVariation;
						variations[ variationName ] =
							pickStyleKeys( typedVariation );
						if ( typedVariation?.css ) {
							variations[ variationName ].css =
								typedVariation.css;
						}
						const variationSelector =
							typeof blockSelectors !== 'string'
								? blockSelectors[ blockName ]
										?.styleVariationSelectors?.[
										variationName
								  ]
								: undefined;

						// Process the variation's inner element styles.
						// This comes before the inner block styles so the
						// element styles within the block type styles take
						// precedence over these.
						Object.entries(
							typedVariation?.elements ?? {}
						).forEach( ( [ element, elementStyles ] ) => {
							if ( elementStyles && ELEMENTS[ element ] ) {
								nodes.push( {
									styles: elementStyles,
									selector: scopeSelector(
										variationSelector,
										ELEMENTS[ element ]
									),
								} );
							}
						} );

						// Process the variations inner block type styles.
						Object.entries( typedVariation?.blocks ?? {} ).forEach(
							( [
								variationBlockName,
								variationBlockStyles,
							] ) => {
								const variationBlockSelector =
									typeof blockSelectors !== 'string'
										? scopeSelector(
												variationSelector,
												blockSelectors[
													variationBlockName
												]?.selector
										  )
										: undefined;
								const variationDuotoneSelector =
									typeof blockSelectors !== 'string'
										? scopeSelector(
												variationSelector,
												blockSelectors[
													variationBlockName
												]?.duotoneSelector as string
										  )
										: undefined;
								const variationFeatureSelectors =
									typeof blockSelectors !== 'string'
										? scopeFeatureSelectors(
												variationSelector,
												blockSelectors[
													variationBlockName
												]?.featureSelectors ?? {}
										  )
										: undefined;

								const variationBlockStyleNodes =
									pickStyleKeys( variationBlockStyles );

								if ( variationBlockStyles?.css ) {
									variationBlockStyleNodes.css =
										variationBlockStyles.css;
								}

								if (
									! variationBlockSelector ||
									typeof blockSelectors === 'string'
								) {
									return;
								}

								nodes.push( {
									selector: variationBlockSelector,
									duotoneSelector: variationDuotoneSelector,
									featureSelectors: variationFeatureSelectors,
									fallbackGapValue:
										blockSelectors[ variationBlockName ]
											?.fallbackGapValue,
									hasLayoutSupport:
										blockSelectors[ variationBlockName ]
											?.hasLayoutSupport,
									styles: variationBlockStyleNodes,
								} );

								// Process element styles for the inner blocks
								// of the variation.
								Object.entries(
									variationBlockStyles.elements ?? {}
								).forEach(
									( [
										variationBlockElement,
										variationBlockElementStyles,
									] ) => {
										if (
											variationBlockElementStyles &&
											ELEMENTS[ variationBlockElement ]
										) {
											nodes.push( {
												styles: variationBlockElementStyles,
												selector: scopeSelector(
													variationBlockSelector,
													ELEMENTS[
														variationBlockElement
													]
												),
											} );
										}
									}
								);
							}
						);
					}
				);
				blockStyles.variations = variations;
			}

			if (
				typeof blockSelectors !== 'string' &&
				blockSelectors?.[ blockName ]?.selector
			) {
				nodes.push( {
					duotoneSelector:
						blockSelectors[ blockName ].duotoneSelector,
					fallbackGapValue:
						blockSelectors[ blockName ].fallbackGapValue,
					hasLayoutSupport:
						blockSelectors[ blockName ].hasLayoutSupport,
					selector: blockSelectors[ blockName ].selector,
					styles: blockStyles,
					featureSelectors:
						blockSelectors[ blockName ].featureSelectors,
					styleVariationSelectors:
						blockSelectors[ blockName ].styleVariationSelectors,
				} );
			}

			Object.entries( typedNode?.elements ?? {} ).forEach(
				( [ elementName, value ] ) => {
					if (
						typeof blockSelectors !== 'string' &&
						value &&
						blockSelectors?.[ blockName ] &&
						ELEMENTS[ elementName ]
					) {
						nodes.push( {
							styles: value,
							selector: blockSelectors[ blockName ]?.selector
								.split( ',' )
								.map( ( sel: string ) => {
									const elementSelectors =
										ELEMENTS[ elementName ].split( ',' );
									return elementSelectors.map(
										( elementSelector: string ) =>
											sel + ' ' + elementSelector
									);
								} )
								.join( ',' ),
						} );
					}
				}
			);
		}
	);

	return nodes;
};

export const getNodesWithSettings = (
	tree: GlobalStylesConfig,
	blockSelectors: string | BlockSelectors
): any[] => {
	const nodes: {
		presets: Record< string, any >;
		custom?: Record< string, any >;
		selector?: string;
		duotoneSelector?: string;
		fallbackGapValue?: string;
		hasLayoutSupport?: boolean;
		featureSelectors?: Record< string, string >;
		styleVariationSelectors?: Record< string, string >;
	}[] = [];

	if ( ! tree?.settings ) {
		return nodes;
	}

	const pickPresets = ( treeToPickFrom: any ): any => {
		let presets = {};
		PRESET_METADATA.forEach( ( { path } ) => {
			const value = getValueFromObjectPath( treeToPickFrom, path, false );
			if ( value !== false ) {
				presets = setImmutably( presets, path, value );
			}
		} );
		return presets;
	};

	// Top-level.
	const presets = pickPresets( tree.settings );
	const custom = tree.settings?.custom;
	if ( Object.keys( presets ).length > 0 || custom ) {
		nodes.push( {
			presets,
			custom,
			selector: ROOT_CSS_PROPERTIES_SELECTOR,
		} );
	}

	// Blocks.
	Object.entries( tree.settings?.blocks ?? {} ).forEach(
		( [ blockName, node ] ) => {
			const blockCustom = node.custom;
			if (
				typeof blockSelectors === 'string' ||
				! blockSelectors[ blockName ]
			) {
				return;
			}
			const blockPresets = pickPresets( node );
			if ( Object.keys( blockPresets ).length > 0 || blockCustom ) {
				nodes.push( {
					presets: blockPresets,
					custom: blockCustom,
					selector: blockSelectors[ blockName ]?.selector,
				} );
			}
		}
	);

	return nodes;
};

export const generateCustomProperties = (
	tree: GlobalStylesConfig,
	blockSelectors: BlockSelectors
): string => {
	const settings = getNodesWithSettings( tree, blockSelectors );
	let ruleset = '';
	settings.forEach( ( { presets, custom, selector } ) => {
		const declarations = tree?.settings
			? getPresetsDeclarations( presets, tree?.settings )
			: [];
		const customProps = flattenTree( custom, '--wp--custom--', '--' );
		if ( customProps.length > 0 ) {
			declarations.push( ...customProps );
		}

		if ( declarations.length > 0 ) {
			ruleset += `${ selector }{${ declarations.join( ';' ) };}`;
		}
	} );

	return ruleset;
};

export const transformToStyles = (
	tree: GlobalStylesConfig,
	blockSelectors: string | BlockSelectors,
	hasBlockGapSupport?: boolean,
	hasFallbackGapSupport?: boolean,
	disableLayoutStyles: boolean = false,
	disableRootPadding: boolean = false,
	styleOptions: Record< string, boolean > = {}
): string => {
	// These allow opting out of certain sets of styles.
	const options = {
		blockGap: true,
		blockStyles: true,
		layoutStyles: true,
		marginReset: true,
		presets: true,
		rootPadding: true,
		variationStyles: false,
		...styleOptions,
	};
	const nodesWithStyles = getNodesWithStyles( tree, blockSelectors );
	const nodesWithSettings = getNodesWithSettings( tree, blockSelectors );
	const useRootPaddingAlign = tree?.settings?.useRootPaddingAwareAlignments;
	const { contentSize, wideSize } = tree?.settings?.layout || {};
	const hasBodyStyles =
		options.marginReset || options.rootPadding || options.layoutStyles;

	let ruleset = '';

	if ( options.presets && ( contentSize || wideSize ) ) {
		ruleset += `${ ROOT_CSS_PROPERTIES_SELECTOR } {`;
		ruleset = contentSize
			? ruleset + ` --wp--style--global--content-size: ${ contentSize };`
			: ruleset;
		ruleset = wideSize
			? ruleset + ` --wp--style--global--wide-size: ${ wideSize };`
			: ruleset;
		ruleset += '}';
	}

	if ( hasBodyStyles ) {
		/*
		 * Reset default browser margin on the body element.
		 * This is set on the body selector **before** generating the ruleset
		 * from the `theme.json`. This is to ensure that if the `theme.json` declares
		 * `margin` in its `spacing` declaration for the `body` element then these
		 * user-generated values take precedence in the CSS cascade.
		 * @link https://github.com/WordPress/gutenberg/issues/36147.
		 */
		ruleset += ':where(body) {margin: 0;';

		// Root padding styles should be output for full templates, patterns and template parts.
		if ( options.rootPadding && useRootPaddingAlign ) {
			/*
			 * These rules reproduce the ones from https://github.com/WordPress/gutenberg/blob/79103f124925d1f457f627e154f52a56228ed5ad/lib/class-wp-theme-json-gutenberg.php#L2508
			 * almost exactly, but for the selectors that target block wrappers in the front end. This code only runs in the editor, so it doesn't need those selectors.
			 */
			ruleset += `padding-right: 0; padding-left: 0; padding-top: var(--wp--style--root--padding-top); padding-bottom: var(--wp--style--root--padding-bottom) }
				.has-global-padding { padding-right: var(--wp--style--root--padding-right); padding-left: var(--wp--style--root--padding-left); }
				.has-global-padding > .alignfull { margin-right: calc(var(--wp--style--root--padding-right) * -1); margin-left: calc(var(--wp--style--root--padding-left) * -1); }
				.has-global-padding :where(:not(.alignfull.is-layout-flow) > .has-global-padding:not(.wp-block-block, .alignfull)) { padding-right: 0; padding-left: 0; }
				.has-global-padding :where(:not(.alignfull.is-layout-flow) > .has-global-padding:not(.wp-block-block, .alignfull)) > .alignfull { margin-left: 0; margin-right: 0;
				`;
		}

		ruleset += '}';
	}

	if ( options.blockStyles ) {
		nodesWithStyles.forEach(
			( {
				selector,
				duotoneSelector,
				styles,
				fallbackGapValue,
				hasLayoutSupport,
				featureSelectors,
				styleVariationSelectors,
				skipSelectorWrapper,
			} ) => {
				// Process styles for block support features with custom feature level
				// CSS selectors set.
				if ( featureSelectors ) {
					const featureDeclarations = getFeatureDeclarations(
						featureSelectors,
						styles
					);

					Object.entries( featureDeclarations ).forEach(
						( [ cssSelector, declarations ] ) => {
							if ( declarations.length ) {
								const rules = declarations.join( ';' );
								ruleset += `:root :where(${ cssSelector }){${ rules };}`;
							}
						}
					);
				}

				// Process duotone styles.
				if ( duotoneSelector ) {
					const duotoneStyles: any = {};
					if ( styles?.filter ) {
						duotoneStyles.filter = styles.filter;
						delete styles.filter;
					}
					const duotoneDeclarations =
						getStylesDeclarations( duotoneStyles );
					if ( duotoneDeclarations.length ) {
						ruleset += `${ duotoneSelector }{${ duotoneDeclarations.join(
							';'
						) };}`;
					}
				}

				// Process blockGap and layout styles.
				if (
					! disableLayoutStyles &&
					( ROOT_BLOCK_SELECTOR === selector || hasLayoutSupport )
				) {
					ruleset += getLayoutStyles( {
						style: styles,
						selector,
						hasBlockGapSupport,
						hasFallbackGapSupport,
						fallbackGapValue,
					} );
				}

				// Process the remaining block styles (they use either normal block class or __experimentalSelector).
				const styleDeclarations = getStylesDeclarations(
					styles,
					selector,
					useRootPaddingAlign,
					tree,
					disableRootPadding
				);
				if ( styleDeclarations?.length ) {
					const generalSelector = skipSelectorWrapper
						? selector
						: `:root :where(${ selector })`;
					ruleset += `${ generalSelector }{${ styleDeclarations.join(
						';'
					) };}`;
				}
				if ( styles?.css ) {
					ruleset += processCSSNesting(
						styles.css,
						`:root :where(${ selector })`
					);
				}

				if ( options.variationStyles && styleVariationSelectors ) {
					Object.entries( styleVariationSelectors ).forEach(
						( [ styleVariationName, styleVariationSelector ] ) => {
							const styleVariations =
								styles?.variations?.[ styleVariationName ];
							if ( styleVariations ) {
								// If the block uses any custom selectors for block support, add those first.
								if ( featureSelectors ) {
									const featureDeclarations =
										getFeatureDeclarations(
											featureSelectors,
											styleVariations
										);

									Object.entries(
										featureDeclarations
									).forEach(
										( [ baseSelector, declarations ]: [
											string,
											string[],
										] ) => {
											if ( declarations.length ) {
												const cssSelector =
													concatFeatureVariationSelectorString(
														baseSelector,
														styleVariationSelector as string
													);
												const rules =
													declarations.join( ';' );
												ruleset += `:root :where(${ cssSelector }){${ rules };}`;
											}
										}
									);
								}

								// Otherwise add regular selectors.
								const styleVariationDeclarations =
									getStylesDeclarations(
										styleVariations,
										styleVariationSelector as string,
										useRootPaddingAlign,
										tree
									);
								if ( styleVariationDeclarations.length ) {
									ruleset += `:root :where(${ styleVariationSelector }){${ styleVariationDeclarations.join(
										';'
									) };}`;
								}
								if ( styleVariations?.css ) {
									ruleset += processCSSNesting(
										styleVariations.css,
										`:root :where(${ styleVariationSelector })`
									);
								}
							}
						}
					);
				}

				// Check for pseudo selector in `styles` and handle separately.
				const pseudoSelectorStyles = Object.entries( styles ).filter(
					( [ key ] ) => key.startsWith( ':' )
				);

				if ( pseudoSelectorStyles?.length ) {
					pseudoSelectorStyles.forEach(
						( [ pseudoKey, pseudoStyle ] ) => {
							const pseudoDeclarations =
								getStylesDeclarations( pseudoStyle );

							if ( ! pseudoDeclarations?.length ) {
								return;
							}

							// `selector` may be provided in a form
							// where block level selectors have sub element
							// selectors appended to them as a comma separated
							// string.
							// e.g. `h1 a,h2 a,h3 a,h4 a,h5 a,h6 a`;
							// Split and append pseudo selector to create
							// the proper rules to target the elements.
							const _selector = selector
								.split( ',' )
								.map( ( sel: string ) => sel + pseudoKey )
								.join( ',' );

							// As pseudo classes such as :hover, :focus etc. have class-level
							// specificity, they must use the `:root :where()` wrapper. This.
							// caps the specificity at `0-1-0` to allow proper nesting of variations
							// and block type element styles.
							const pseudoRule = `:root :where(${ _selector }){${ pseudoDeclarations.join(
								';'
							) };}`;

							ruleset += pseudoRule;
						}
					);
				}
			}
		);
	}

	if ( options.layoutStyles ) {
		/* Add alignment / layout styles */
		ruleset =
			ruleset +
			'.wp-site-blocks > .alignleft { float: left; margin-right: 2em; }';
		ruleset =
			ruleset +
			'.wp-site-blocks > .alignright { float: right; margin-left: 2em; }';
		ruleset =
			ruleset +
			'.wp-site-blocks > .aligncenter { justify-content: center; margin-left: auto; margin-right: auto; }';
	}

	if ( options.blockGap && hasBlockGapSupport ) {
		// Use fallback of `0.5em` just in case, however if there is blockGap support, there should nearly always be a real value.
		const gapValue =
			getGapCSSValue( tree?.styles?.spacing?.blockGap ) || '0.5em';
		ruleset =
			ruleset +
			`:root :where(.wp-site-blocks) > * { margin-block-start: ${ gapValue }; margin-block-end: 0; }`;
		ruleset =
			ruleset +
			':root :where(.wp-site-blocks) > :first-child { margin-block-start: 0; }';
		ruleset =
			ruleset +
			':root :where(.wp-site-blocks) > :last-child { margin-block-end: 0; }';
	}

	if ( options.presets ) {
		nodesWithSettings.forEach( ( { selector, presets } ) => {
			if (
				ROOT_BLOCK_SELECTOR === selector ||
				ROOT_CSS_PROPERTIES_SELECTOR === selector
			) {
				// Do not add extra specificity for top-level classes.
				selector = '';
			}

			const classes = getPresetsClasses( selector, presets );
			if ( classes.length > 0 ) {
				ruleset += classes;
			}
		} );
	}

	return ruleset;
};

export function generateSvgFilters(
	tree: GlobalStylesConfig,
	blockSelectors: BlockSelectors
): string[] {
	const nodesWithSettings = getNodesWithSettings( tree, blockSelectors );
	return nodesWithSettings.flatMap( ( { presets } ) => {
		return getPresetsSvgFilters( presets );
	} );
}

const getSelectorsConfig = ( blockType: BlockType, rootSelector: string ) => {
	if (
		blockType?.selectors &&
		Object.keys( blockType.selectors ).length > 0
	) {
		return blockType.selectors;
	}

	const config: Record< string, string > = {
		root: rootSelector,
	};
	Object.entries( BLOCK_SUPPORT_FEATURE_LEVEL_SELECTORS ).forEach(
		( [ featureKey, featureName ] ) => {
			const featureSelector = getBlockSelector( blockType, featureKey );

			if ( featureSelector ) {
				config[ featureName ] = featureSelector;
			}
		}
	);

	return config;
};

export const getBlockSelectors = (
	blockTypes: BlockType[],
	variationInstanceId?: string
) => {
	const { getBlockStyles } = select( blocksStore );
	const result: BlockSelectors = {};
	blockTypes.forEach( ( blockType ) => {
		const name = blockType.name;
		const selector = getBlockSelector( blockType );

		if ( ! selector ) {
			return; // Skip blocks without valid selectors
		}
		let duotoneSelector = getBlockSelector( blockType, 'filter.duotone' );
		// Keep backwards compatibility for support.color.__experimentalDuotone.
		if ( ! duotoneSelector ) {
			const rootSelector = getBlockSelector( blockType );
			const duotoneSupport = getBlockSupport(
				blockType,
				'color.__experimentalDuotone',
				false
			);
			duotoneSelector =
				duotoneSupport &&
				rootSelector &&
				scopeSelector( rootSelector, duotoneSupport );
		}

		const hasLayoutSupport =
			!! blockType?.supports?.layout ||
			!! blockType?.supports?.__experimentalLayout;
		const fallbackGapValue =
			// @ts-expect-error
			blockType?.supports?.spacing?.blockGap?.__experimentalDefault;

		const blockStyleVariations = getBlockStyles( name );
		const styleVariationSelectors: Record< string, string > = {};
		blockStyleVariations?.forEach( ( variation: BlockStyleVariation ) => {
			const variationSuffix = variationInstanceId
				? `-${ variationInstanceId }`
				: '';
			const variationName = `${ variation.name }${ variationSuffix }`;
			const styleVariationSelector = getBlockStyleVariationSelector(
				variationName,
				selector
			);

			styleVariationSelectors[ variationName ] = styleVariationSelector;
		} );

		// For each block support feature add any custom selectors.
		const featureSelectors = getSelectorsConfig( blockType, selector );

		result[ name ] = {
			duotoneSelector: duotoneSelector ?? undefined,
			fallbackGapValue,
			featureSelectors: Object.keys( featureSelectors ).length
				? featureSelectors
				: undefined,
			hasLayoutSupport,
			name,
			selector,
			styleVariationSelectors: blockStyleVariations?.length
				? styleVariationSelectors
				: undefined,
		};
	} );

	return result;
};

/**
 * If there is a separator block whose color is defined in theme.json via background,
 * update the separator color to the same value by using border color.
 *
 * @param config Theme.json configuration file object
 * @return Theme.json configuration file object updated
 */
function updateConfigWithSeparator(
	config: GlobalStylesConfig
): GlobalStylesConfig {
	const blocks = config.styles?.blocks;
	const separatorBlock = blocks?.[ 'core/separator' ];
	const needsSeparatorStyleUpdate =
		separatorBlock &&
		separatorBlock.color?.background &&
		! separatorBlock.color?.text &&
		! separatorBlock.border?.color;
	if ( needsSeparatorStyleUpdate ) {
		return {
			...config,
			styles: {
				...config.styles,
				blocks: {
					...blocks,
					'core/separator': {
						...separatorBlock,
						color: {
							...separatorBlock.color,
							text: separatorBlock.color?.background,
						},
					},
				},
			},
		};
	}
	return config;
}

export function processCSSNesting( css: string, blockSelector: string ) {
	let processedCSS = '';

	if ( ! css || css.trim() === '' ) {
		return processedCSS;
	}

	// Split CSS nested rules.
	const parts = css.split( '&' );
	parts.forEach( ( part: string ) => {
		if ( ! part || part.trim() === '' ) {
			return;
		}

		const isRootCss = ! part.includes( '{' );
		if ( isRootCss ) {
			// If the part doesn't contain braces, it applies to the root level.
			processedCSS += `:root :where(${ blockSelector }){${ part.trim() }}`;
		} else {
			// If the part contains braces, it's a nested CSS rule.
			const splitPart = part.replace( '}', '' ).split( '{' );
			if ( splitPart.length !== 2 ) {
				return;
			}

			const [ nestedSelector, cssValue ] = splitPart;

			// Handle pseudo elements such as ::before, ::after, etc. Regex will also
			// capture any leading combinator such as >, +, or ~, as well as spaces.
			// This allows pseudo elements as descendants e.g. `.parent ::before`.
			const matches = nestedSelector.match( /([>+~\s]*::[a-zA-Z-]+)/ );
			const pseudoPart = matches ? matches[ 1 ] : '';
			const withoutPseudoElement = matches
				? nestedSelector.replace( pseudoPart, '' ).trim()
				: nestedSelector.trim();

			let combinedSelector;
			if ( withoutPseudoElement === '' ) {
				// Only contained a pseudo element to use the block selector to form
				// the final `:root :where()` selector.
				combinedSelector = blockSelector;
			} else {
				// If the nested selector is a descendant of the block scope it with the
				// block selector. Otherwise append it to the block selector.
				combinedSelector = nestedSelector.startsWith( ' ' )
					? scopeSelector( blockSelector, withoutPseudoElement )
					: appendToSelector( blockSelector, withoutPseudoElement );
			}

			// Build final rule, re-adding any pseudo element outside the `:where()`
			// to maintain valid CSS selector.
			processedCSS += `:root :where(${ combinedSelector })${ pseudoPart }{${ cssValue.trim() }}`;
		}
	} );
	return processedCSS;
}

export interface GlobalStylesRenderOptions {
	hasBlockGapSupport?: boolean;
	hasFallbackGapSupport?: boolean;
	disableLayoutStyles?: boolean;
	disableRootPadding?: boolean;
	getBlockStyles?: ( blockName: string ) => any[];
}

/**
 * Returns the global styles output based on the current state of global styles config loaded in the editor context.
 *
 * @param config     Global styles configuration
 * @param blockTypes Array of block types from WordPress blocks store
 * @param options    Options for rendering global styles
 * @return Array of stylesheets and settings
 */
export function generateGlobalStyles(
	config: GlobalStylesConfig | undefined = {},
	blockTypes: any[] = [],
	options: GlobalStylesRenderOptions = {}
): [ any[], any ] {
	const {
		hasBlockGapSupport: hasBlockGapSupportOption,
		hasFallbackGapSupport: hasFallbackGapSupportOption,
		disableLayoutStyles = false,
		disableRootPadding = false,
	} = options;

	// Use provided block types or fall back to getBlockTypes()
	const blocks = blockTypes.length > 0 ? blockTypes : getBlockTypes();

	const blockGap = getSetting( config, 'spacing.blockGap' );
	const hasBlockGapSupport = hasBlockGapSupportOption ?? blockGap !== null;
	const hasFallbackGapSupport =
		hasFallbackGapSupportOption ?? ! hasBlockGapSupport;

	if ( ! config?.styles || ! config?.settings ) {
		return [ [], {} ];
	}
	const updatedConfig = updateConfigWithSeparator( config );
	const blockSelectors = getBlockSelectors( blocks );
	const customProperties = generateCustomProperties(
		updatedConfig,
		blockSelectors
	);
	const globalStyles = transformToStyles(
		updatedConfig,
		blockSelectors,
		hasBlockGapSupport,
		hasFallbackGapSupport,
		disableLayoutStyles,
		disableRootPadding
	);
	const svgs = generateSvgFilters( updatedConfig, blockSelectors );
	const styles = [
		{
			css: customProperties,
			isGlobalStyles: true,
		},
		{
			css: globalStyles,
			isGlobalStyles: true,
		},
		// Load custom CSS in own stylesheet so that any invalid CSS entered in the input won't break all the global styles in the editor.
		{
			css: updatedConfig?.styles?.css ?? '',
			isGlobalStyles: true,
		},
		{
			assets: svgs,
			__unstableType: 'svg',
			isGlobalStyles: true,
		},
	];

	// Loop through the blocks to check if there are custom CSS values.
	// If there are, get the block selector and push the selector together with
	// the CSS value to the 'stylesheets' array.
	blocks.forEach( ( blockType: BlockType ) => {
		const blockStyles = updatedConfig?.styles?.blocks?.[ blockType.name ];
		if ( blockStyles?.css ) {
			const selector = blockSelectors[ blockType.name ].selector;
			styles.push( {
				css: processCSSNesting( blockStyles.css, selector ),
				isGlobalStyles: true,
			} );
		}
	} );

	return [ styles, updatedConfig.settings ];
}
