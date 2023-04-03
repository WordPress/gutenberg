/**
 * External dependencies
 */
import { get, isEmpty, kebabCase, set } from 'lodash';

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
import { renderToString, useContext, useMemo } from '@wordpress/element';
import { getCSSRules } from '@wordpress/style-engine';

/**
 * Internal dependencies
 */
import { PRESET_METADATA, ROOT_BLOCK_SELECTOR, scopeSelector } from './utils';
import { getBlockCSSSelector } from './get-block-css-selector';
import { getTypographyFontSizeValue } from './typography-utils';
import { GlobalStylesContext } from './context';
import { useGlobalSetting } from './hooks';
import { PresetDuotoneFilter } from '../duotone/components';
import { getGapCSSValue } from '../../hooks/gap';
import { store as blockEditorStore } from '../../store';

// List of block support features that can have their related styles
// generated under their own feature level selector rather than the block's.
const BLOCK_SUPPORT_FEATURE_LEVEL_SELECTORS = {
	__experimentalBorder: 'border',
	color: 'color',
	spacing: 'spacing',
	typography: 'typography',
};

function compileStyleValue( uncompiledValue ) {
	const VARIABLE_REFERENCE_PREFIX = 'var:';
	const VARIABLE_PATH_SEPARATOR_TOKEN_ATTRIBUTE = '|';
	const VARIABLE_PATH_SEPARATOR_TOKEN_STYLE = '--';

	if ( uncompiledValue?.startsWith?.( VARIABLE_REFERENCE_PREFIX ) ) {
		const variable = uncompiledValue
			.slice( VARIABLE_REFERENCE_PREFIX.length )
			.split( VARIABLE_PATH_SEPARATOR_TOKEN_ATTRIBUTE )
			.join( VARIABLE_PATH_SEPARATOR_TOKEN_STYLE );
		return `var(--wp--${ variable })`;
	}
	return uncompiledValue;
}

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
			const presetByOrigin = get( blockPresets, path, [] );
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

			const presetByOrigin = get( blockPresets, path, [] );
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
		const presetByOrigin = get( blockPresets, metadata.path, {} );
		return [ 'default', 'theme' ]
			.filter( ( origin ) => presetByOrigin[ origin ] )
			.flatMap( ( origin ) =>
				presetByOrigin[ origin ].map( ( preset ) =>
					renderToString(
						<PresetDuotoneFilter
							preset={ preset }
							key={ preset.slug }
						/>
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
 *
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
 * @return {Array} An array of style declarations.
 */
export function getStylesDeclarations(
	blockStyles = {},
	selector = '',
	useRootPaddingAlign,
	tree = {}
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

			const styleValue = get( blockStyles, pathToValue );

			// Root-level padding styles don't currently support strings with CSS shorthand values.
			// This may change: https://github.com/WordPress/gutenberg/issues/40132.
			if (
				key === '--wp--style--root--padding' &&
				( typeof styleValue === 'string' || ! useRootPaddingAlign )
			) {
				return declarations;
			}

			if ( !! properties && typeof styleValue !== 'string' ) {
				Object.entries( properties ).forEach( ( entry ) => {
					const [ name, prop ] = entry;

					if ( ! get( styleValue, [ prop ], false ) ) {
						// Do not create a declaration
						// for sub-properties that don't have any value.
						return;
					}

					const cssProperty = name.startsWith( '--' )
						? name
						: kebabCase( name );
					declarations.push(
						`${ cssProperty }: ${ compileStyleValue(
							get( styleValue, [ prop ] )
						) }`
					);
				} );
			} else if ( get( blockStyles, pathToValue, false ) ) {
				const cssProperty = key.startsWith( '--' )
					? key
					: kebabCase( key );
				declarations.push(
					`${ cssProperty }: ${ compileStyleValue(
						get( blockStyles, pathToValue )
					) }`
				);
			}

			return declarations;
		},
		[]
	);

	// The goal is to move everything to server side generated engine styles
	// This is temporary as we absorb more and more styles into the engine.
	const extraRules = getCSSRules( blockStyles );
	extraRules.forEach( ( rule ) => {
		// Don't output padding properties if padding variables are set.
		if (
			isRoot &&
			useRootPaddingAlign &&
			rule.key.startsWith( 'padding' )
		) {
			return;
		}
		const cssProperty = rule.key.startsWith( '--' )
			? rule.key
			: kebabCase( rule.key );

		let ruleValue = rule.value;
		if ( typeof ruleValue !== 'string' && ruleValue?.ref ) {
			const refPath = ruleValue.ref.split( '.' );
			ruleValue = get( tree, refPath );
			// Presence of another ref indicates a reference to another dynamic value.
			// Pointing to another dynamic value is not supported.
			if ( ! ruleValue || !! ruleValue?.ref ) {
				return;
			}
		}

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
				tree?.settings?.typography
			);
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
 * @param {Object}  props.tree                  A theme.json tree containing layout definitions.
 * @param {Object}  props.style                 A style object containing spacing values.
 * @param {string}  props.selector              Selector used to group together layout styling rules.
 * @param {boolean} props.hasBlockGapSupport    Whether or not the theme opts-in to blockGap support.
 * @param {boolean} props.hasFallbackGapSupport Whether or not the theme allows fallback gap styles.
 * @param {?string} props.fallbackGapValue      An optional fallback gap value if no real gap value is available.
 * @return {string} Generated CSS rules for the layout styles.
 */
export function getLayoutStyles( {
	tree,
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

	if ( gapValue && tree?.settings?.layout?.definitions ) {
		Object.values( tree.settings.layout.definitions ).forEach(
			( { className, name, spacingStyles } ) => {
				// Allow outputting fallback gap styles for flex layout type when block gap support isn't available.
				if ( ! hasBlockGapSupport && 'flex' !== name ) {
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
										? `:where(${ selector } .${ className })${
												spacingStyle?.selector || ''
										  }`
										: `${ selector }-${ className }${
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
			ruleset += `${ selector } { --wp--style--block-gap: ${ gapValue }; }`;
		}
	}

	// Output base styles
	if (
		selector === ROOT_BLOCK_SELECTOR &&
		tree?.settings?.layout?.definitions
	) {
		const validDisplayModes = [ 'block', 'flex', 'grid' ];
		Object.values( tree.settings.layout.definitions ).forEach(
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
							const combinedSelector = `${ selector } .${ className }${
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

export const getNodesWithStyles = ( tree, blockSelectors ) => {
	const nodes = [];

	if ( ! tree?.styles ) {
		return nodes;
	}

	const pickStyleKeys = ( treeToPickFrom ) =>
		Object.fromEntries(
			Object.entries( treeToPickFrom ?? {} ).filter( ( [ key ] ) =>
				[
					'border',
					'color',
					'dimensions',
					'spacing',
					'typography',
					'filter',
					'outline',
					'shadow',
				].includes( key )
			)
		);

	// Top-level.
	const styles = pickStyleKeys( tree.styles );
	if ( !! styles ) {
		nodes.push( {
			styles,
			selector: ROOT_BLOCK_SELECTOR,
		} );
	}

	Object.entries( ELEMENTS ).forEach( ( [ name, selector ] ) => {
		if ( !! tree.styles?.elements?.[ name ] ) {
			nodes.push( {
				styles: tree.styles?.elements?.[ name ],
				selector,
			} );
		}
	} );

	// Iterate over blocks: they can have styles & elements.
	Object.entries( tree.styles?.blocks ?? {} ).forEach(
		( [ blockName, node ] ) => {
			const blockStyles = pickStyleKeys( node );

			if ( node?.variations ) {
				const variations = {};
				Object.keys( node.variations ).forEach( ( variation ) => {
					variations[ variation ] = pickStyleKeys(
						node.variations[ variation ]
					);
				} );
				blockStyles.variations = variations;
			}
			if (
				!! blockStyles &&
				!! blockSelectors?.[ blockName ]?.selector
			) {
				nodes.push( {
					duotoneSelector:
						blockSelectors[ blockName ].duotoneSelector,
					fallbackGapValue:
						blockSelectors[ blockName ].fallbackGapValue,
					hasLayoutSupport:
						blockSelectors[ blockName ].hasLayoutSupport,
					selector: blockSelectors[ blockName ]?.selector,
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
						!! value &&
						!! blockSelectors?.[ blockName ] &&
						!! ELEMENTS?.[ elementName ]
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
		const presets = {};
		PRESET_METADATA.forEach( ( { path } ) => {
			const value = get( treeToPickFrom, path, false );
			if ( value !== false ) {
				set( presets, path, value );
			}
		} );
		return presets;
	};

	// Top-level.
	const presets = pickPresets( tree.settings );
	const custom = tree.settings?.custom;
	if ( ! isEmpty( presets ) || !! custom ) {
		nodes.push( {
			presets,
			custom,
			selector: ROOT_BLOCK_SELECTOR,
		} );
	}

	// Blocks.
	Object.entries( tree.settings?.blocks ?? {} ).forEach(
		( [ blockName, node ] ) => {
			const blockPresets = pickPresets( node );
			const blockCustom = node.custom;
			if ( ! isEmpty( blockPresets ) || !! blockCustom ) {
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
			ruleset = ruleset + `${ selector }{${ declarations.join( ';' ) };}`;
		}
	} );

	return ruleset;
};

export const toStyles = (
	tree,
	blockSelectors,
	hasBlockGapSupport,
	hasFallbackGapSupport,
	disableLayoutStyles = false
) => {
	const nodesWithStyles = getNodesWithStyles( tree, blockSelectors );
	const nodesWithSettings = getNodesWithSettings( tree, blockSelectors );
	const useRootPaddingAlign = tree?.settings?.useRootPaddingAwareAlignments;
	const { contentSize, wideSize } = tree?.settings?.layout || {};

	/*
	 * Reset default browser margin on the root body element.
	 * This is set on the root selector **before** generating the ruleset
	 * from the `theme.json`. This is to ensure that if the `theme.json` declares
	 * `margin` in its `spacing` declaration for the `body` element then these
	 * user-generated values take precedence in the CSS cascade.
	 * @link https://github.com/WordPress/gutenberg/issues/36147.
	 */
	let ruleset = 'body {margin: 0;';

	if ( contentSize ) {
		ruleset += ` --wp--style--global--content-size: ${ contentSize };`;
	}

	if ( wideSize ) {
		ruleset += ` --wp--style--global--wide-size: ${ wideSize };`;
	}

	if ( useRootPaddingAlign ) {
		/*
		 * These rules reproduce the ones from https://github.com/WordPress/gutenberg/blob/79103f124925d1f457f627e154f52a56228ed5ad/lib/class-wp-theme-json-gutenberg.php#L2508
		 * almost exactly, but for the selectors that target block wrappers in the front end. This code only runs in the editor, so it doesn't need those selectors.
		 */
		ruleset += `padding-right: 0; padding-left: 0; padding-top: var(--wp--style--root--padding-top); padding-bottom: var(--wp--style--root--padding-bottom) }
			.has-global-padding { padding-right: var(--wp--style--root--padding-right); padding-left: var(--wp--style--root--padding-left); }
			.has-global-padding :where(.has-global-padding) { padding-right: 0; padding-left: 0; }
			.has-global-padding > .alignfull { margin-right: calc(var(--wp--style--root--padding-right) * -1); margin-left: calc(var(--wp--style--root--padding-left) * -1); }
			.has-global-padding :where(.has-global-padding) > .alignfull { margin-right: 0; margin-left: 0; }
			.has-global-padding > .alignfull:where(:not(.has-global-padding)) > :where(.wp-block:not(.alignfull),p,h1,h2,h3,h4,h5,h6,ul,ol) { padding-right: var(--wp--style--root--padding-right); padding-left: var(--wp--style--root--padding-left); }
			.has-global-padding :where(.has-global-padding) > .alignfull:where(:not(.has-global-padding)) > :where(.wp-block:not(.alignfull),p,h1,h2,h3,h4,h5,h6,ul,ol) { padding-right: 0; padding-left: 0;`;
	}

	ruleset += '}';

	nodesWithStyles.forEach(
		( {
			selector,
			duotoneSelector,
			styles,
			fallbackGapValue,
			hasLayoutSupport,
			featureSelectors,
			styleVariationSelectors,
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
						if ( !! declarations.length ) {
							const rules = declarations.join( ';' );
							ruleset = ruleset + `${ cssSelector }{${ rules }}`;
						}
					}
				);
			}

			if ( styleVariationSelectors ) {
				Object.entries( styleVariationSelectors ).forEach(
					( [ styleVariationName, styleVariationSelector ] ) => {
						if ( styles?.variations?.[ styleVariationName ] ) {
							// If the block uses any custom selectors for block support, add those first.
							if ( featureSelectors ) {
								const featureDeclarations =
									getFeatureDeclarations(
										featureSelectors,
										styles?.variations?.[
											styleVariationName
										]
									);

								Object.entries( featureDeclarations ).forEach(
									( [ baseSelector, declarations ] ) => {
										if ( !! declarations.length ) {
											const cssSelector =
												concatFeatureVariationSelectorString(
													baseSelector,
													styleVariationSelector
												);
											const rules =
												declarations.join( ';' );
											ruleset =
												ruleset +
												`${ cssSelector }{${ rules }}`;
										}
									}
								);
							}

							// Otherwise add regular selectors.
							const styleVariationDeclarations =
								getStylesDeclarations(
									styles?.variations?.[ styleVariationName ],
									styleVariationSelector,
									useRootPaddingAlign,
									tree
								);
							if ( !! styleVariationDeclarations.length ) {
								ruleset =
									ruleset +
									`${ styleVariationSelector }{${ styleVariationDeclarations.join(
										';'
									) }}`;
							}
						}
					}
				);
			}

			const duotoneStyles = {};
			if ( styles?.filter ) {
				duotoneStyles.filter = styles.filter;
				delete styles.filter;
			}

			// Process duotone styles.
			if ( duotoneSelector ) {
				const duotoneDeclarations =
					getStylesDeclarations( duotoneStyles );
				if ( duotoneDeclarations.length > 0 ) {
					ruleset =
						ruleset +
						`${ duotoneSelector }{${ duotoneDeclarations.join(
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
					tree,
					style: styles,
					selector,
					hasBlockGapSupport,
					hasFallbackGapSupport,
					fallbackGapValue,
				} );
			}

			// Process the remaining block styles (they use either normal block class or __experimentalSelector).
			const declarations = getStylesDeclarations(
				styles,
				selector,
				useRootPaddingAlign,
				tree
			);
			if ( declarations?.length ) {
				ruleset =
					ruleset + `${ selector }{${ declarations.join( ';' ) };}`;
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

						// `selector` maybe provided in a form
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

						const pseudoRule = `${ _selector }{${ pseudoDeclarations.join(
							';'
						) };}`;

						ruleset = ruleset + pseudoRule;
					}
				);
			}
		}
	);

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

	if ( hasBlockGapSupport ) {
		// Use fallback of `0.5em` just in case, however if there is blockGap support, there should nearly always be a real value.
		const gapValue =
			getGapCSSValue( tree?.styles?.spacing?.blockGap ) || '0.5em';
		ruleset =
			ruleset +
			`:where(.wp-site-blocks) > * { margin-block-start: ${ gapValue }; margin-block-end: 0; }`;
		ruleset =
			ruleset +
			':where(.wp-site-blocks) > :first-child:first-child { margin-block-start: 0; }';
		ruleset =
			ruleset +
			':where(.wp-site-blocks) > :last-child:last-child { margin-block-end: 0; }';
	}

	nodesWithSettings.forEach( ( { selector, presets } ) => {
		if ( ROOT_BLOCK_SELECTOR === selector ) {
			// Do not add extra specificity for top-level classes.
			selector = '';
		}

		const classes = getPresetsClasses( selector, presets );
		if ( ! isEmpty( classes ) ) {
			ruleset = ruleset + classes;
		}
	} );

	return ruleset;
};

export function toSvgFilters( tree, blockSelectors ) {
	const nodesWithSettings = getNodesWithSettings( tree, blockSelectors );
	return nodesWithSettings.flatMap( ( { presets } ) => {
		return getPresetsSvgFilters( presets );
	} );
}

const getSelectorsConfig = ( blockType, rootSelector ) => {
	if ( ! isEmpty( blockType?.selectors ) ) {
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

export const getBlockSelectors = ( blockTypes, getBlockStyles ) => {
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

		const hasLayoutSupport = !! blockType?.supports?.__experimentalLayout;
		const fallbackGapValue =
			blockType?.supports?.spacing?.blockGap?.__experimentalDefault;

		const blockStyleVariations = getBlockStyles( name );
		const styleVariationSelectors = {};
		if ( blockStyleVariations?.length ) {
			blockStyleVariations.forEach( ( variation ) => {
				const styleVariationSelector = `.is-style-${ variation.name }${ selector }`;
				styleVariationSelectors[ variation.name ] =
					styleVariationSelector;
			} );
		}
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
			styleVariationSelectors: Object.keys( styleVariationSelectors )
				.length
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

const processCSSNesting = ( css, blockSelector ) => {
	let processedCSS = '';

	// Split CSS nested rules.
	const parts = css.split( '&' );
	parts.forEach( ( part ) => {
		processedCSS += ! part.includes( '{' )
			? blockSelector + '{' + part + '}' // If the part doesn't contain braces, it applies to the root level.
			: blockSelector + part; // Prepend the selector, which effectively replaces the "&" character.
	} );
	return processedCSS;
};

export function useGlobalStylesOutput() {
	let { merged: mergedConfig } = useContext( GlobalStylesContext );

	const [ blockGap ] = useGlobalSetting( 'spacing.blockGap' );
	const hasBlockGapSupport = blockGap !== null;
	const hasFallbackGapSupport = ! hasBlockGapSupport; // This setting isn't useful yet: it exists as a placeholder for a future explicit fallback styles support.
	const disableLayoutStyles = useSelect( ( select ) => {
		const { getSettings } = select( blockEditorStore );
		return !! getSettings().disableLayoutStyles;
	} );

	const getBlockStyles = useSelect( ( select ) => {
		return select( blocksStore ).getBlockStyles;
	}, [] );

	return useMemo( () => {
		if ( ! mergedConfig?.styles || ! mergedConfig?.settings ) {
			return [];
		}
		mergedConfig = updateConfigWithSeparator( mergedConfig );

		const blockSelectors = getBlockSelectors(
			getBlockTypes(),
			getBlockStyles
		);

		const customProperties = toCustomProperties(
			mergedConfig,
			blockSelectors
		);
		const globalStyles = toStyles(
			mergedConfig,
			blockSelectors,
			hasBlockGapSupport,
			hasFallbackGapSupport,
			disableLayoutStyles
		);
		const svgs = toSvgFilters( mergedConfig, blockSelectors );

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
				css: mergedConfig.styles.css ?? '',
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
			if ( mergedConfig.styles.blocks[ blockType.name ]?.css ) {
				const selector = blockSelectors[ blockType.name ].selector;
				styles.push( {
					css: processCSSNesting(
						mergedConfig.styles.blocks[ blockType.name ]?.css,
						selector
					),
					isGlobalStyles: true,
				} );
			}
		} );

		return [ styles, mergedConfig.settings ];
	}, [
		hasBlockGapSupport,
		hasFallbackGapSupport,
		mergedConfig,
		disableLayoutStyles,
	] );
}
