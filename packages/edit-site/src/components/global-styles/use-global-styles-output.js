/**
 * External dependencies
 */
import {
	first,
	forEach,
	get,
	isEmpty,
	isString,
	kebabCase,
	pickBy,
	reduce,
	set,
	startsWith,
} from 'lodash';

/**
 * WordPress dependencies
 */
import {
	__EXPERIMENTAL_STYLE_PROPERTY as STYLE_PROPERTY,
	__EXPERIMENTAL_ELEMENTS as ELEMENTS,
	getBlockTypes,
} from '@wordpress/blocks';
import { useEffect, useState, useContext } from '@wordpress/element';
import { getCSSRules } from '@wordpress/style-engine';

/**
 * Internal dependencies
 */

/**
 * Internal dependencies
 */
import { PRESET_METADATA, ROOT_BLOCK_SELECTOR } from './utils';
import { GlobalStylesContext } from './context';

function compileStyleValue( uncompiledValue ) {
	const VARIABLE_REFERENCE_PREFIX = 'var:';
	const VARIABLE_PATH_SEPARATOR_TOKEN_ATTRIBUTE = '|';
	const VARIABLE_PATH_SEPARATOR_TOKEN_STYLE = '--';
	if ( startsWith( uncompiledValue, VARIABLE_REFERENCE_PREFIX ) ) {
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
 *
 * @return {Array} An array of style declarations.
 */
function getPresetsDeclarations( blockPresets = {} ) {
	return reduce(
		PRESET_METADATA,
		( declarations, { path, valueKey, cssVarInfix } ) => {
			const presetByOrigin = get( blockPresets, path, [] );
			[ 'default', 'theme', 'custom' ].forEach( ( origin ) => {
				if ( presetByOrigin[ origin ] ) {
					presetByOrigin[ origin ].forEach( ( value ) => {
						declarations.push(
							`--wp--preset--${ cssVarInfix }--${ kebabCase(
								value.slug
							) }: ${ value[ valueKey ] }`
						);
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
 * @param {string} blockSelector
 * @param {Object} blockPresets
 * @return {string} CSS declarations for the preset classes.
 */
function getPresetsClasses( blockSelector, blockPresets = {} ) {
	return reduce(
		PRESET_METADATA,
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
 * Transform given style tree into a set of style declarations.
 *
 * @param {Object} blockStyles Block styles.
 *
 * @return {Array} An array of style declarations.
 */
function getStylesDeclarations( blockStyles = {} ) {
	const output = reduce(
		STYLE_PROPERTY,
		( declarations, { value, properties, useEngine }, key ) => {
			const pathToValue = value;
			if ( first( pathToValue ) === 'elements' || useEngine ) {
				return declarations;
			}

			const styleValue = get( blockStyles, pathToValue );

			if ( !! properties && ! isString( styleValue ) ) {
				Object.entries( properties ).forEach( ( entry ) => {
					const [ name, prop ] = entry;

					if ( ! get( styleValue, [ prop ], false ) ) {
						// Do not create a declaration
						// for sub-properties that don't have any value.
						return;
					}

					const cssProperty = kebabCase( name );
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
	const extraRules = getCSSRules( blockStyles, { selector: 'self' } );
	extraRules.forEach( ( rule ) => {
		if ( rule.selector !== 'self' ) {
			throw "This style can't be added as inline style";
		}
		const cssProperty = rule.key.startsWith( '--' )
			? rule.key
			: kebabCase( rule.key );
		output.push( `${ cssProperty }: ${ compileStyleValue( rule.value ) }` );
	} );

	return output;
}

export const getNodesWithStyles = ( tree, blockSelectors ) => {
	const nodes = [];

	if ( ! tree?.styles ) {
		return nodes;
	}

	const pickStyleKeys = ( treeToPickFrom ) =>
		pickBy( treeToPickFrom, ( value, key ) =>
			[
				'border',
				'color',
				'dimensions',
				'spacing',
				'typography',
			].includes( key )
		);

	// Top-level.
	const styles = pickStyleKeys( tree.styles );
	if ( !! styles ) {
		nodes.push( {
			styles,
			selector: ROOT_BLOCK_SELECTOR,
		} );
	}
	forEach( tree.styles?.elements, ( value, key ) => {
		if ( !! value && !! ELEMENTS[ key ] ) {
			nodes.push( {
				styles: value,
				selector: ELEMENTS[ key ],
			} );
		}
	} );

	// Iterate over blocks: they can have styles & elements.
	forEach( tree.styles?.blocks, ( node, blockName ) => {
		const blockStyles = pickStyleKeys( node );
		if ( !! blockStyles && !! blockSelectors?.[ blockName ]?.selector ) {
			nodes.push( {
				styles: blockStyles,
				selector: blockSelectors[ blockName ].selector,
			} );
		}

		forEach( node?.elements, ( value, elementName ) => {
			if (
				!! value &&
				!! blockSelectors?.[ blockName ] &&
				!! ELEMENTS?.[ elementName ]
			) {
				nodes.push( {
					styles: value,
					selector: blockSelectors[ blockName ].selector
						.split( ',' )
						.map( ( sel ) => sel + ' ' + ELEMENTS[ elementName ] )
						.join( ',' ),
				} );
			}
		} );
	} );

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
	forEach( tree.settings?.blocks, ( node, blockName ) => {
		const blockPresets = pickPresets( node );
		const blockCustom = node.custom;
		if ( ! isEmpty( blockPresets ) || !! blockCustom ) {
			nodes.push( {
				presets: blockPresets,
				custom: blockCustom,
				selector: blockSelectors[ blockName ].selector,
			} );
		}
	} );

	return nodes;
};

export const toCustomProperties = ( tree, blockSelectors ) => {
	const settings = getNodesWithSettings( tree, blockSelectors );

	let ruleset = '';
	settings.forEach( ( { presets, custom, selector } ) => {
		const declarations = getPresetsDeclarations( presets );
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

export const toStyles = ( tree, blockSelectors ) => {
	const nodesWithStyles = getNodesWithStyles( tree, blockSelectors );
	const nodesWithSettings = getNodesWithSettings( tree, blockSelectors );

	let ruleset =
		'.wp-site-blocks > * { margin-top: 0; margin-bottom: 0; }.wp-site-blocks > * + * { margin-top: var( --wp--style--block-gap ); }';
	nodesWithStyles.forEach( ( { selector, styles } ) => {
		const declarations = getStylesDeclarations( styles );
		if ( declarations.length === 0 ) {
			return;
		}
		ruleset = ruleset + `${ selector }{${ declarations.join( ';' ) };}`;
	} );

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

const getBlockSelectors = ( blockTypes ) => {
	const result = {};
	blockTypes.forEach( ( blockType ) => {
		const name = blockType.name;
		const selector =
			blockType?.supports?.__experimentalSelector ??
			'.wp-block-' + name.replace( 'core/', '' ).replace( '/', '-' );
		result[ name ] = {
			name,
			selector,
		};
	} );

	return result;
};

export function useGlobalStylesOutput() {
	const [ stylesheets, setStylesheets ] = useState( [] );
	const [ settings, setSettings ] = useState( {} );
	const { merged: mergedConfig } = useContext( GlobalStylesContext );

	useEffect( () => {
		if ( ! mergedConfig?.styles || ! mergedConfig?.settings ) {
			return;
		}

		const blockSelectors = getBlockSelectors( getBlockTypes() );
		const customProperties = toCustomProperties(
			mergedConfig,
			blockSelectors
		);
		const globalStyles = toStyles( mergedConfig, blockSelectors );
		setStylesheets( [
			{
				css: customProperties,
				isGlobalStyles: true,
			},
			{
				css: globalStyles,
				isGlobalStyles: true,
			},
		] );
		setSettings( mergedConfig.settings );
	}, [ mergedConfig ] );

	return [ stylesheets, settings ];
}
