/**
 * External dependencies
 */
import { get, kebabCase, reduce, startsWith } from 'lodash';

/**
 * WordPress dependencies
 */
import { __EXPERIMENTAL_STYLE_PROPERTY as STYLE_PROPERTY } from '@wordpress/blocks';

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

export default ( blockData, tree ) => {
	const styles = [];
	// Can this be converted to a context, as the global context?
	// See comment in the server.
	styles.push( LINK_COLOR_DECLARATION );

	/**
	 * Transform given style tree into a set of style declarations.
	 *
	 * @param {Object} blockSupports What styles the block supports.
	 * @param {Object} blockStyles Block styles.
	 *
	 * @return {Array} An array of style declarations.
	 */
	const getBlockStylesDeclarations = ( blockSupports, blockStyles = {} ) => {
		const declarations = [];
		Object.keys( STYLE_PROPERTY ).forEach( ( key ) => {
			const cssProperty = key.startsWith( '--' ) ? key : kebabCase( key );
			if (
				blockSupports.includes( key ) &&
				get( blockStyles, STYLE_PROPERTY[ key ], false )
			) {
				declarations.push(
					`${ cssProperty }: ${ compileStyleValue(
						get( blockStyles, STYLE_PROPERTY[ key ] )
					) }`
				);
			}
		} );

		return declarations;
	};

	/**
	 * Transform given preset tree into a set of preset class declarations.
	 *
	 * @param {string} blockSelector
	 * @param {Object} blockPresets
	 * @return {string} CSS declarations for the preset classes.
	 */
	const getBlockPresetClasses = ( blockSelector, blockPresets = {} ) => {
		return reduce(
			PRESET_CLASSES,
			( declarations, { path, key, property }, classSuffix ) => {
				const presets = get( blockPresets, path, [] );
				presets.forEach( ( preset ) => {
					const slug = preset.slug;
					const value = preset[ key ];
					const classSelectorToUse = `.has-${ slug }-${ classSuffix }`;
					const selectorToUse = `${ blockSelector }${ classSelectorToUse }`;
					declarations += `${ selectorToUse } {${ property }: ${ value };}\n`;
				} );
				return declarations;
			},
			''
		);
	};

	/**
	 * Transform given preset tree into a set of style declarations.
	 *
	 * @param {Object} blockPresets
	 *
	 * @return {Array} An array of style declarations.
	 */
	const getBlockPresetsDeclarations = ( blockPresets = {} ) => {
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
	};

	const flattenTree = ( input, prefix, token ) => {
		let result = [];
		Object.keys( input ).forEach( ( key ) => {
			const newKey = prefix + kebabCase( key.replace( '/', '-' ) );
			const newLeaf = input[ key ];

			if ( newLeaf instanceof Object ) {
				const newPrefix = newKey + token;
				result = [
					...result,
					...flattenTree( newLeaf, newPrefix, token ),
				];
			} else {
				result.push( `${ newKey }: ${ newLeaf }` );
			}
		} );
		return result;
	};

	const getCustomDeclarations = ( blockCustom = {} ) => {
		if ( Object.keys( blockCustom ).length === 0 ) {
			return [];
		}

		return flattenTree( blockCustom, '--wp--custom--', '--' );
	};

	const getBlockSelector = ( selector ) => {
		// Can we hook into the styles generation mechanism
		// so we can avoid having to increase the class specificity here
		// and remap :root?
		if ( ':root' === selector ) {
			selector = '';
		}
		return `.editor-styles-wrapper.editor-styles-wrapper ${ selector }`;
	};

	Object.keys( blockData ).forEach( ( context ) => {
		const blockSelector = getBlockSelector( blockData[ context ].selector );

		const blockDeclarations = [
			...getBlockStylesDeclarations(
				blockData[ context ].supports,
				tree?.[ context ]?.styles
			),
			...getBlockPresetsDeclarations( tree?.[ context ]?.settings ),
			...getCustomDeclarations( tree?.[ context ]?.settings?.custom ),
		];
		if ( blockDeclarations.length > 0 ) {
			styles.push(
				`${ blockSelector } { ${ blockDeclarations.join( ';' ) } }`
			);
		}

		const presetClasses = getBlockPresetClasses(
			blockSelector,
			tree?.[ context ]?.settings
		);
		if ( presetClasses ) {
			styles.push( presetClasses );
		}
	} );

	return styles.join( '' );
};
