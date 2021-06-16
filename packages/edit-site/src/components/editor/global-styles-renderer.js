/**
 * External dependencies
 */
import {
	capitalize,
	first,
	forEach,
	get,
	isEmpty,
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
} from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { PRESET_METADATA, ROOT_BLOCK_SELECTOR } from './utils';

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
			const preset = get( blockPresets, path, [] );
			preset.forEach( ( value ) => {
				declarations.push(
					`--wp--preset--${ cssVarInfix }--${ value.slug }: ${ value[ valueKey ] }`
				);
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
		( declarations, { path, valueKey, classes } ) => {
			if ( ! classes ) {
				return declarations;
			}
			const presets = get( blockPresets, path, [] );
			presets.forEach( ( preset ) => {
				classes.forEach( ( { classSuffix, propertyName } ) => {
					const slug = preset.slug;
					const value = preset[ valueKey ];
					const classSelectorToUse = `.has-${ slug }-${ classSuffix }`;
					const selectorToUse = `${ blockSelector }${ classSelectorToUse }`;
					declarations += `${ selectorToUse }{${ propertyName }: ${ value } !important;}`;
				} );
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
 * @param {Object} blockStyles   Block styles.
 *
 * @return {Array} An array of style declarations.
 */
function getStylesDeclarations( blockStyles = {} ) {
	return reduce(
		STYLE_PROPERTY,
		( declarations, { value, properties }, key ) => {
			const pathToValue = value;
			if ( first( pathToValue ) === 'elements' ) {
				return declarations;
			}
			if ( !! properties ) {
				properties.forEach( ( prop ) => {
					if (
						! get( blockStyles, [ ...pathToValue, prop ], false )
					) {
						// Do not create a declaration
						// for sub-properties that don't have any value.
						return;
					}
					const cssProperty = kebabCase(
						`${ key }${ capitalize( prop ) }`
					);
					declarations.push(
						`${ cssProperty }: ${ compileStyleValue(
							get( blockStyles, [ ...pathToValue, prop ] )
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
}

export const getNodesWithStyles = ( tree, blockSelectors ) => {
	const nodes = [];

	if ( ! tree?.styles ) {
		return nodes;
	}

	const pickStyleKeys = ( treeToPickFrom ) =>
		pickBy( treeToPickFrom, ( value, key ) =>
			[ 'border', 'color', 'spacing', 'typography' ].includes( key )
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
				!! blockSelectors?.[ blockName ]?.elements?.[ elementName ]
			) {
				nodes.push( {
					styles: value,
					selector:
						blockSelectors[ blockName ].elements[ elementName ],
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
	if ( ! isEmpty( presets ) ) {
		nodes.push( {
			presets,
			custom: tree.settings?.custom,
			selector: ROOT_BLOCK_SELECTOR,
		} );
	}

	// Blocks.
	forEach( tree.settings?.blocks, ( node, blockName ) => {
		const blockPresets = pickPresets( node );
		if ( ! isEmpty( blockPresets ) ) {
			nodes.push( {
				presets: blockPresets,
				custom: node.custom,
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

	let ruleset = '';
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
