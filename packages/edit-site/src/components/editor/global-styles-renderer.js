/**
 * External dependencies
 */
import { capitalize, get, kebabCase, reduce, startsWith } from 'lodash';

/**
 * WordPress dependencies
 */
import { __EXPERIMENTAL_STYLE_PROPERTY as STYLE_PROPERTY } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { LINK_COLOR_DECLARATION, PRESET_METADATA } from './utils';

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
function getBlockPresetsDeclarations( blockPresets = {} ) {
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
function getBlockPresetClasses( blockSelector, blockPresets = {} ) {
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
function getBlockStylesDeclarations( blockStyles = {} ) {
	return reduce(
		STYLE_PROPERTY,
		( declarations, { value, properties }, key ) => {
			if ( !! properties ) {
				properties.forEach( ( prop ) => {
					if ( ! get( blockStyles, [ ...value, prop ], false ) ) {
						// Do not create a declaration
						// for sub-properties that don't have any value.
						return;
					}
					const cssProperty = key.startsWith( '--' )
						? key
						: kebabCase( `${ key }${ capitalize( prop ) }` );
					declarations.push(
						`${ cssProperty }: ${ compileStyleValue(
							get( blockStyles, [ ...value, prop ] )
						) }`
					);
				} );
			} else if ( get( blockStyles, value, false ) ) {
				const cssProperty = key.startsWith( '--' )
					? key
					: kebabCase( key );
				declarations.push(
					`${ cssProperty }: ${ compileStyleValue(
						get( blockStyles, value )
					) }`
				);
			}

			return declarations;
		},
		[]
	);
}

export default ( blockData, tree, type = 'all' ) => {
	return reduce(
		blockData,
		( styles, { selector }, context ) => {
			if ( type === 'all' || type === 'cssVariables' ) {
				const variableDeclarations = [
					...getBlockPresetsDeclarations(
						tree?.settings?.[ context ]
					),
					...flattenTree(
						tree?.settings?.[ context ]?.custom,
						'--wp--custom--',
						'--'
					),
				];

				if ( variableDeclarations.length > 0 ) {
					styles.push(
						`${ selector } { ${ variableDeclarations.join(
							';'
						) } }`
					);
				}
			}
			if ( type === 'all' || type === 'blockStyles' ) {
				const blockStyleDeclarations = getBlockStylesDeclarations(
					tree?.styles?.[ context ]
				);

				if ( blockStyleDeclarations.length > 0 ) {
					styles.push(
						`${ selector } { ${ blockStyleDeclarations.join(
							';'
						) } }`
					);
				}

				const presetClasses = getBlockPresetClasses(
					selector,
					tree?.settings?.[ context ]
				);
				if ( presetClasses ) {
					styles.push( presetClasses );
				}
			}
			return styles;
		},
		// Can this be converted to a context, as the global context?
		// See comment in the server.
		type === 'all' || type === 'blockStyles'
			? [ LINK_COLOR_DECLARATION ]
			: []
	).join( '' );
};
