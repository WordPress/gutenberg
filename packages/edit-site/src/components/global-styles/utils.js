/**
 * WordPress dependencies
 */
import { PRESET_METADATA, findInPresetsBy } from '@wordpress/block-editor';

/* Supporting data. */
export const ROOT_BLOCK_NAME = 'root';
export const ROOT_BLOCK_SELECTOR = 'body';
export const ROOT_BLOCK_SUPPORTS = [
	'background',
	'backgroundColor',
	'color',
	'linkColor',
	'buttonColor',
	'fontFamily',
	'fontSize',
	'fontStyle',
	'fontWeight',
	'lineHeight',
	'textDecoration',
	'textTransform',
	'padding',
];

export const STYLE_PATH_TO_CSS_VAR_INFIX = {
	'color.background': 'color',
	'color.text': 'color',
	'elements.link.color.text': 'color',
	'elements.button.color.text': 'color',
	'elements.button.backgroundColor': 'background-color',
	'elements.heading.color': 'color',
	'elements.heading.backgroundColor': 'background-color',
	'elements.heading.gradient': 'gradient',
	'color.gradient': 'gradient',
	'typography.fontSize': 'font-size',
	'typography.fontFamily': 'font-family',
};

// A static list of block attributes that store global style preset slugs.
export const STYLE_PATH_TO_PRESET_BLOCK_ATTRIBUTE = {
	'color.background': 'backgroundColor',
	'color.text': 'textColor',
	'color.gradient': 'gradient',
	'typography.fontSize': 'fontSize',
	'typography.fontFamily': 'fontFamily',
};

export function getPresetVariableFromValue(
	features,
	blockName,
	variableStylePath,
	presetPropertyValue
) {
	if ( ! presetPropertyValue ) {
		return presetPropertyValue;
	}

	const cssVarInfix = STYLE_PATH_TO_CSS_VAR_INFIX[ variableStylePath ];

	const metadata = PRESET_METADATA.find(
		( data ) => data.cssVarInfix === cssVarInfix
	);

	if ( ! metadata ) {
		// The property doesn't have preset data
		// so the value should be returned as it is.
		return presetPropertyValue;
	}
	const { valueKey, path } = metadata;

	const presetObject = findInPresetsBy(
		features,
		blockName,
		path,
		valueKey,
		presetPropertyValue
	);

	if ( ! presetObject ) {
		// Value wasn't found in the presets,
		// so it must be a custom value.
		return presetPropertyValue;
	}

	return `var:preset|${ cssVarInfix }|${ presetObject.slug }`;
}

/**
 * Function that scopes a selector with another one. This works a bit like
 * SCSS nesting except the `&` operator isn't supported.
 *
 * @example
 * ```js
 * const scope = '.a, .b .c';
 * const selector = '> .x, .y';
 * const merged = scopeSelector( scope, selector );
 * // merged is '.a > .x, .a .y, .b .c > .x, .b .c .y'
 * ```
 *
 * @param {string} scope    Selector to scope to.
 * @param {string} selector Original selector.
 *
 * @return {string} Scoped selector.
 */
export function scopeSelector( scope, selector ) {
	const scopes = scope.split( ',' );
	const selectors = selector.split( ',' );

	const selectorsScoped = [];
	scopes.forEach( ( outer ) => {
		selectors.forEach( ( inner ) => {
			selectorsScoped.push( `${ outer.trim() } ${ inner.trim() }` );
		} );
	} );

	return selectorsScoped.join( ', ' );
}
