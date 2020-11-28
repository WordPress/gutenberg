/**
 * External dependencies
 */
import { get, kebabCase, reduce, startsWith } from 'lodash';

/**
 * Internal dependencies
 */
import {
	PRESET_CATEGORIES,
	PRESET_CLASSES,
	LINK_COLOR_DECLARATION,
} from './utils';

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
		PRESET_CATEGORIES,
		( declarations, { path, key }, category ) => {
			const preset = get( blockPresets, path, [] );
			preset.forEach( ( value ) => {
				declarations.push(
					`--wp--preset--${ kebabCase( category ) }--${
						value.slug
					}: ${ value[ key ] }`
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
		PRESET_CLASSES,
		( declarations, { path, key, property }, classSuffix ) => {
			const presets = get( blockPresets, path, [] );
			presets.forEach( ( preset ) => {
				const slug = preset.slug;
				const value = preset[ key ];
				const classSelectorToUse = `.has-${ slug }-${ classSuffix }`;
				const selectorToUse = `${ blockSelector }${ classSelectorToUse }`;
				declarations += `${ selectorToUse } {${ property }: ${ value };}`;
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
 * @param {Object} blockSupports What styles the block supports.
 * @param {Object} blockStyles   Block styles.
 * @param {Object} metadata      Block styles metadata information.
 *
 * @return {Array} An array of style declarations.
 */
function getBlockStylesDeclarations(
	blockSupports,
	blockStyles = {},
	metadata
) {
	return reduce(
		metadata,
		( declarations, { value }, key ) => {
			const cssProperty = key.startsWith( '--' ) ? key : kebabCase( key );
			if (
				blockSupports.includes( key ) &&
				get( blockStyles, value, false )
			) {
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

export default ( blockData, tree, metadata, type = 'all' ) => {
	return reduce(
		blockData,
		( styles, { selector }, context ) => {
			if ( type === 'all' || type === 'cssVariables' ) {
				const variableDeclarations = [
					...getBlockPresetsDeclarations(
						tree?.[ context ]?.settings
					),
					...flattenTree(
						tree?.[ context ]?.settings?.custom,
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
					blockData[ context ].supports,
					tree?.[ context ]?.styles,
					metadata
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
					tree?.[ context ]?.settings
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
