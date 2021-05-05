/**
 * External dependencies
 */
import {
	capitalize,
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
import { __EXPERIMENTAL_STYLE_PROPERTY as STYLE_PROPERTY } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { PRESET_METADATA, ROOT_BLOCK_SELECTOR, ELEMENTS } from './utils';

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
		( declarations, { value, valueGlobal, properties }, key ) => {
			const pathToValue = valueGlobal ?? value;
			if ( !! properties ) {
				properties.forEach( ( prop ) => {
					if (
						! get( blockStyles, [ ...pathToValue, prop ], false )
					) {
						// Do not create a declaration
						// for sub-properties that don't have any value.
						return;
					}
					const cssProperty = key.startsWith( '--' )
						? key
						: kebabCase( `${ key }${ capitalize( prop ) }` );
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
	forEach( tree.styles?.elements, ( value, index ) => {
		nodes.push( {
			styles: value,
			selector: ELEMENTS[ index ],
		} );
	} );

	// Iterate over blocks: they can have styles & elements.
	forEach( tree.styles?.blocks, ( node, blockName ) => {
		const blockStyles = pickStyleKeys( node );
		if ( !! blockStyles ) {
			nodes.push( {
				styles: blockStyles,
				selector: blockSelectors[ blockName ].selector,
			} );
		}

		forEach( node?.elements, ( value, elementName ) => {
			nodes.push( {
				styles: value,
				selector: blockSelectors[ blockName ].elements[ elementName ],
			} );
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

const containsLinkElement = ( selector ) =>
	selector.toLowerCase().includes( ELEMENTS.link );
const withoutLinkSelector = ( selector ) => {
	const newSelector = selector
		.split( ',' )
		.map( ( individualSelector ) =>
			individualSelector.replace( ELEMENTS.link, '' ).trim()
		)
		.join( ',' );

	if ( '' === newSelector ) {
		return ROOT_BLOCK_SELECTOR;
	}

	return newSelector;
};

export const toStyles = ( tree, blockSelectors ) => {
	const nodesWithStyles = getNodesWithStyles( tree, blockSelectors );
	const nodesWithSettings = getNodesWithSettings( tree, blockSelectors );

	let ruleset = `${ ELEMENTS.link }{color: var(--wp--style--color--link);}`;
	nodesWithStyles.forEach( ( { selector, styles } ) => {
		const declarations = getStylesDeclarations( styles );

		if ( declarations.length === 0 ) {
			return;
		}

		if ( ! containsLinkElement( selector ) ) {
			ruleset = ruleset + `${ selector }{${ declarations.join( ';' ) };}`;
		} else {
			// To be removed when the user provided styles for link color
			// no longer use the --wp--style--link-color variable.
			//
			// We need to:
			//
			// 1. For the color property, output:
			//
			//    $selector_without_the_link_element_selector {
			//        --wp--style--color--link: value
			//    }
			//
			// 2. For the rest of the properties:
			//
			//    $selector {
			//        other-prop: value;
			//        other-prop: value;
			//    }
			//
			// The reason for 1 is that user styles are attached to the block wrapper.
			// If 1 targets the a element is going to have higher specificity
			// and will overwrite the user preferences.
			//
			// Once the user styles are updated to output an `a` element instead
			// this can be removed.

			const declarationsColor = declarations.filter(
				( declaration ) => declaration.split( ':' )[ 0 ] === 'color'
			);
			const declarationsOther = declarations.filter(
				( declaration ) => declaration.split( ':' )[ 0 ] !== 'color'
			);

			if ( declarationsOther.length > 0 ) {
				ruleset =
					ruleset +
					`${ selector }{${ declarationsOther.join( ';' ) };}`;
			}

			if ( declarationsColor.length === 1 ) {
				const value = declarationsColor[ 0 ].split( ':' )[ 1 ];
				ruleset =
					ruleset +
					`${ withoutLinkSelector(
						selector
					) }{--wp--style--color--link:${ value };}`;
			}
		}
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
