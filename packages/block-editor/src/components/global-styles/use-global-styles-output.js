/**
 * WordPress dependencies
 */
import {
	__EXPERIMENTAL_STYLE_PROPERTY as STYLE_PROPERTY,
	__EXPERIMENTAL_ELEMENTS as ELEMENTS,
	getBlockSupport,
	getBlockTypes,
	store as blocksStore,
} from '@wordpress/blocks';
import { useSelect } from '@wordpress/data';
import { useContext, useMemo } from '@wordpress/element';
import { getCSSRules, getCSSValueFromRawStyle } from '@wordpress/style-engine';
import { privateApis as componentsPrivateApis } from '@wordpress/components';

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
} from './utils';
import { getBlockCSSSelector } from './get-block-css-selector';
import { getTypographyFontSizeValue } from './typography-utils';
import { GlobalStylesContext } from './context';
import { useGlobalSetting } from './hooks';
import { getDuotoneFilter } from '../duotone/utils';
import { getGapCSSValue } from '../../hooks/gap';
import { setBackgroundStyleDefaults } from '../../hooks/background';
import { store as blockEditorStore } from '../../store';
import { LAYOUT_DEFINITIONS } from '../../layouts/definitions';
import { getValueFromObjectPath, setImmutably } from '../../utils/object';
import { unlock } from '../../lock-unlock';

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
const { kebabCase } = unlock( componentsPrivateApis );

/**
 * Transform given preset tree into a set of style declarations.
 *
 * @param {Object} blockPresets
 * @param {Object} mergedSettings Merged theme.json settings.
 *
 * @return {Array<Object>} An array of style declarations.
 */
function getPresetsDeclarations( blockPresets = {}, mergedSettings ) {
	return PRESET_METADATA.reduce(
		( declarations, { path, valueKey, valueFunc, cssVarInfix } ) => {
			const presetByOrigin = getValueFromObjectPath(
				blockPresets,
				path,
				[]
			);
			[ 'default', 'theme', 'custom' ].forEach( ( origin ) => {
				if ( presetByOrigin[ origin ] ) {
					presetByOrigin[ origin ].forEach( ( value ) => {
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
		[]
	);
}

/**
 * Transform given preset tree into a set of preset class declarations.
 *
 * @param {?string} blockSelector
 * @param {Object}  blockPresets
 * @return {string} CSS declarations for the preset classes.
 */
function getPresetsClasses( blockSelector = '*', blockPresets = {} ) {
	return PRESET_METADATA.reduce(
		( declarations, { path, cssVarInfix, classes } ) => {
			if ( ! classes ) {
				return declarations;
			}

			const presetByOrigin = getValueFromObjectPath(
				blockPresets,
				path,
				[]
			);
			[ 'default', 'theme', 'custom' ].forEach( ( origin ) => {
				if ( presetByOrigin[ origin ] ) {
					presetByOrigin[ origin ].forEach( ( { slug } ) => {
						classes.forEach( ( { classSuffix, propertyName } ) => {
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
						} );
					} );
				}
			} );
			return declarations;
		},
		''
	);
}

function getPresetsSvgFilters( blockPresets = {} ) {
	return PRESET_METADATA.filter(
		// Duotone are the only type of filters for now.
		( metadata ) => metadata.path.at( -1 ) === 'duotone'
	).flatMap( ( metadata ) => {
		const presetByOrigin = getValueFromObjectPath(
			blockPresets,
			metadata.path,
			{}
		);
		return [ 'default', 'theme' ]
			.filter( ( origin ) => presetByOrigin[ origin ] )
			.flatMap( ( origin ) =>
				presetByOrigin[ origin ].map( ( preset ) =>
					getDuotoneFilter(
						`wp-duotone-${ preset.slug }`,
						preset.colors
					)
				)
			)
			.join( '' );
	} );
}

function flattenTree( input = {}, prefix, token ) {
	let result = [];
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
 * @param {string} featureSelector        The feature selector.
 *
 * @param {string} styleVariationSelector The style variation selector.
 * @return {string} Combined selector string.
 */
function concatFeatureVariationSelectorString(
	featureSelector,
	styleVariationSelector
) {
	const featureSelectors = featureSelector.split( ',' );
	const combinedSelectors = [];
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
 * @param {Object} selectors Custom selectors object for a block.
 * @param {Object} styles    A block's styles object.
 *
 * @return {Object} Style declarations.
 */
const getFeatureDeclarations = ( selectors, styles ) => {
	const declarations = {};

	Object.entries( selectors ).forEach( ( [ feature, selector ] ) => {
		// We're only processing features/subfeatures that have styles.
		if ( feature === 'root' || ! styles?.[ feature ] ) {
			return;
		}

		const isShorthand = typeof selector === 'string';

		// If we have a selector object instead of shorthand process it.
		if ( ! isShorthand ) {
			Object.entries( selector ).forEach(
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
		if ( isShorthand || selector.root ) {
			const featureSelector = isShorthand ? selector : selector.root;

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
 * @param {Object}  blockStyles         Block styles.
 *
 * @param {string}  selector            The selector these declarations should attach to.
 *
 * @param {boolean} useRootPaddingAlign Whether to use CSS custom properties in root selector.
 *
 * @param {Object}  tree                A theme.json tree containing layout definitions.
 *
 * @param {boolean} disableRootPadding  Whether to force disable the root padding styles.
 * @return {Array} An array of style declarations.
 */
export function getStylesDeclarations(
	blockStyles = {},
	selector = '',
	useRootPaddingAlign,
	tree = {},
	disableRootPadding = false
) {
	const isRoot = ROOT_BLOCK_SELECTOR === selector;
	const output = Object.entries( STYLE_PROPERTY ).reduce(
		(
			declarations,
			[ key, { value, properties, useEngine, rootOnly } ]
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
		[]
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
	extraRules.forEach( ( rule ) => {
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

		let ruleValue = getResolvedValue( rule.value, tree, null );

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
				{ size: ruleValue },
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
 * @param {Object}  props
 * @param {Object}  props.layoutDefinitions     Layout definitions, keyed by layout type.
 * @param {Object}  props.style                 A style object containing spacing values.
 * @param {string}  props.selector              Selector used to group together layout styling rules.
 * @param {boolean} props.hasBlockGapSupport    Whether or not the theme opts-in to blockGap support.
 * @param {boolean} props.hasFallbackGapSupport Whether or not the theme allows fallback gap styles.
 * @param {?string} props.fallbackGapValue      An optional fallback gap value if no real gap value is available.
 * @return {string} Generated CSS rules for the layout styles.
 */
export function getLayoutStyles( {
	layoutDefinitions = LAYOUT_DEFINITIONS,
	style,
	selector,
	hasBlockGapSupport,
	hasFallbackGapSupport,
	fallbackGapValue,
} ) {
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
					spacingStyles.forEach( ( spacingStyle ) => {
						const declarations = [];

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
			( { className, displayMode, baseStyles } ) => {
				if (
					displayMode &&
					validDisplayModes.includes( displayMode )
				) {
					ruleset += `${ selector } .${ className } { display:${ displayMode }; }`;
				}

				if ( baseStyles?.length ) {
					baseStyles.forEach( ( baseStyle ) => {
						const declarations = [];

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

function pickStyleKeys( treeToPickFrom ) {
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

export const getNodesWithStyles = ( tree, blockSelectors ) => {
	const nodes = [];

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
				styles: tree.styles?.elements?.[ name ],
				selector,
				// Top level elements that don't use a class name should not receive the
				// `:root :where()` wrapper to maintain backwards compatibility.
				skipSelectorWrapper: ! ELEMENT_CLASS_NAMES[ name ],
			} );
		}
	} );

	// Iterate over blocks: they can have styles & elements.
	Object.entries( tree.styles?.blocks ?? {} ).forEach(
		( [ blockName, node ] ) => {
			const blockStyles = pickStyleKeys( node );

			if ( node?.variations ) {
				const variations = {};
				Object.entries( node.variations ).forEach(
					( [ variationName, variation ] ) => {
						variations[ variationName ] =
							pickStyleKeys( variation );
						if ( variation?.css ) {
							variations[ variationName ].css = variation.css;
						}
						const variationSelector =
							blockSelectors[ blockName ]
								?.styleVariationSelectors?.[ variationName ];

						// Process the variation's inner element styles.
						// This comes before the inner block styles so the
						// element styles within the block type styles take
						// precedence over these.
						Object.entries( variation?.elements ?? {} ).forEach(
							( [ element, elementStyles ] ) => {
								if ( elementStyles && ELEMENTS[ element ] ) {
									nodes.push( {
										styles: elementStyles,
										selector: scopeSelector(
											variationSelector,
											ELEMENTS[ element ]
										),
									} );
								}
							}
						);

						// Process the variations inner block type styles.
						Object.entries( variation?.blocks ?? {} ).forEach(
							( [
								variationBlockName,
								variationBlockStyles,
							] ) => {
								const variationBlockSelector = scopeSelector(
									variationSelector,
									blockSelectors[ variationBlockName ]
										?.selector
								);
								const variationDuotoneSelector = scopeSelector(
									variationSelector,
									blockSelectors[ variationBlockName ]
										?.duotoneSelector
								);
								const variationFeatureSelectors =
									scopeFeatureSelectors(
										variationSelector,
										blockSelectors[ variationBlockName ]
											?.featureSelectors
									);

								const variationBlockStyleNodes =
									pickStyleKeys( variationBlockStyles );

								if ( variationBlockStyles?.css ) {
									variationBlockStyleNodes.css =
										variationBlockStyles.css;
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

			if ( blockSelectors?.[ blockName ]?.selector ) {
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

			Object.entries( node?.elements ?? {} ).forEach(
				( [ elementName, value ] ) => {
					if (
						value &&
						blockSelectors?.[ blockName ] &&
						ELEMENTS[ elementName ]
					) {
						nodes.push( {
							styles: value,
							selector: blockSelectors[ blockName ]?.selector
								.split( ',' )
								.map( ( sel ) => {
									const elementSelectors =
										ELEMENTS[ elementName ].split( ',' );
									return elementSelectors.map(
										( elementSelector ) =>
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

export const getNodesWithSettings = ( tree, blockSelectors ) => {
	const nodes = [];

	if ( ! tree?.settings ) {
		return nodes;
	}

	const pickPresets = ( treeToPickFrom ) => {
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
			const blockPresets = pickPresets( node );
			const blockCustom = node.custom;
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

export const toCustomProperties = ( tree, blockSelectors ) => {
	const settings = getNodesWithSettings( tree, blockSelectors );
	let ruleset = '';
	settings.forEach( ( { presets, custom, selector } ) => {
		const declarations = getPresetsDeclarations( presets, tree?.settings );
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

export const toStyles = (
	tree,
	blockSelectors,
	hasBlockGapSupport,
	hasFallbackGapSupport,
	disableLayoutStyles = false,
	disableRootPadding = false,
	styleOptions = undefined
) => {
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
					const duotoneStyles = {};
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
										( [ baseSelector, declarations ] ) => {
											if ( declarations.length ) {
												const cssSelector =
													concatFeatureVariationSelectorString(
														baseSelector,
														styleVariationSelector
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
										styleVariationSelector,
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
								.map( ( sel ) => sel + pseudoKey )
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

export function toSvgFilters( tree, blockSelectors ) {
	const nodesWithSettings = getNodesWithSettings( tree, blockSelectors );
	return nodesWithSettings.flatMap( ( { presets } ) => {
		return getPresetsSvgFilters( presets );
	} );
}

const getSelectorsConfig = ( blockType, rootSelector ) => {
	if (
		blockType?.selectors &&
		Object.keys( blockType.selectors ).length > 0
	) {
		return blockType.selectors;
	}

	const config = { root: rootSelector };
	Object.entries( BLOCK_SUPPORT_FEATURE_LEVEL_SELECTORS ).forEach(
		( [ featureKey, featureName ] ) => {
			const featureSelector = getBlockCSSSelector(
				blockType,
				featureKey
			);

			if ( featureSelector ) {
				config[ featureName ] = featureSelector;
			}
		}
	);

	return config;
};

export const getBlockSelectors = (
	blockTypes,
	getBlockStyles,
	variationInstanceId
) => {
	const result = {};
	blockTypes.forEach( ( blockType ) => {
		const name = blockType.name;
		const selector = getBlockCSSSelector( blockType );
		let duotoneSelector = getBlockCSSSelector(
			blockType,
			'filter.duotone'
		);

		// Keep backwards compatibility for support.color.__experimentalDuotone.
		if ( ! duotoneSelector ) {
			const rootSelector = getBlockCSSSelector( blockType );
			const duotoneSupport = getBlockSupport(
				blockType,
				'color.__experimentalDuotone',
				false
			);
			duotoneSelector =
				duotoneSupport && scopeSelector( rootSelector, duotoneSupport );
		}

		const hasLayoutSupport =
			!! blockType?.supports?.layout ||
			!! blockType?.supports?.__experimentalLayout;
		const fallbackGapValue =
			blockType?.supports?.spacing?.blockGap?.__experimentalDefault;

		const blockStyleVariations = getBlockStyles( name );
		const styleVariationSelectors = {};
		blockStyleVariations?.forEach( ( variation ) => {
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
			duotoneSelector,
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
 * @param {Object} config Theme.json configuration file object.
 * @return {Object} configTheme.json configuration file object updated.
 */
function updateConfigWithSeparator( config ) {
	const needsSeparatorStyleUpdate =
		config.styles?.blocks?.[ 'core/separator' ] &&
		config.styles?.blocks?.[ 'core/separator' ].color?.background &&
		! config.styles?.blocks?.[ 'core/separator' ].color?.text &&
		! config.styles?.blocks?.[ 'core/separator' ].border?.color;
	if ( needsSeparatorStyleUpdate ) {
		return {
			...config,
			styles: {
				...config.styles,
				blocks: {
					...config.styles.blocks,
					'core/separator': {
						...config.styles.blocks[ 'core/separator' ],
						color: {
							...config.styles.blocks[ 'core/separator' ].color,
							text: config.styles?.blocks[ 'core/separator' ]
								.color.background,
						},
					},
				},
			},
		};
	}
	return config;
}

export function processCSSNesting( css, blockSelector ) {
	let processedCSS = '';

	if ( ! css || css.trim() === '' ) {
		return processedCSS;
	}

	// Split CSS nested rules.
	const parts = css.split( '&' );
	parts.forEach( ( part ) => {
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

/**
 * Returns the global styles output using a global styles configuration.
 * If wishing to generate global styles and settings based on the
 * global styles config loaded in the editor context, use `useGlobalStylesOutput()`.
 * The use case for a custom config is to generate bespoke styles
 * and settings for previews, or other out-of-editor experiences.
 *
 * @param {Object}  mergedConfig       Global styles configuration.
 * @param {boolean} disableRootPadding Disable root padding styles.
 *
 * @return {Array} Array of stylesheets and settings.
 */
export function useGlobalStylesOutputWithConfig(
	mergedConfig = {},
	disableRootPadding
) {
	const [ blockGap ] = useGlobalSetting( 'spacing.blockGap' );
	const hasBlockGapSupport = blockGap !== null;
	const hasFallbackGapSupport = ! hasBlockGapSupport; // This setting isn't useful yet: it exists as a placeholder for a future explicit fallback styles support.
	const disableLayoutStyles = useSelect( ( select ) => {
		const { getSettings } = select( blockEditorStore );
		return !! getSettings().disableLayoutStyles;
	} );

	const { getBlockStyles } = useSelect( blocksStore );

	return useMemo( () => {
		if ( ! mergedConfig?.styles || ! mergedConfig?.settings ) {
			return [];
		}
		const updatedConfig = updateConfigWithSeparator( mergedConfig );

		const blockSelectors = getBlockSelectors(
			getBlockTypes(),
			getBlockStyles
		);

		const customProperties = toCustomProperties(
			updatedConfig,
			blockSelectors
		);

		const globalStyles = toStyles(
			updatedConfig,
			blockSelectors,
			hasBlockGapSupport,
			hasFallbackGapSupport,
			disableLayoutStyles,
			disableRootPadding
		);
		const svgs = toSvgFilters( updatedConfig, blockSelectors );

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
				css: updatedConfig.styles.css ?? '',
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
		getBlockTypes().forEach( ( blockType ) => {
			if ( updatedConfig.styles.blocks[ blockType.name ]?.css ) {
				const selector = blockSelectors[ blockType.name ].selector;
				styles.push( {
					css: processCSSNesting(
						updatedConfig.styles.blocks[ blockType.name ]?.css,
						selector
					),
					isGlobalStyles: true,
				} );
			}
		} );

		return [ styles, updatedConfig.settings ];
	}, [
		hasBlockGapSupport,
		hasFallbackGapSupport,
		mergedConfig,
		disableLayoutStyles,
		disableRootPadding,
		getBlockStyles,
	] );
}

/**
 * Returns the global styles output based on the current state of global styles config loaded in the editor context.
 *
 * @param {boolean} disableRootPadding Disable root padding styles.
 *
 * @return {Array} Array of stylesheets and settings.
 */
export function useGlobalStylesOutput( disableRootPadding = false ) {
	const { merged: mergedConfig } = useContext( GlobalStylesContext );
	return useGlobalStylesOutputWithConfig( mergedConfig, disableRootPadding );
}
