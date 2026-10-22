/**
 * Shared style-path helpers.
 *
 * These live here rather than in `index.jsx` so both the global and the
 * sibling scope can read block style values the same way.
 */

// TODO: Temporary duplication of constant in @wordpress/block-editor. Can be
// removed by moving PushChangesToGlobalStylesControl to
// @wordpress/block-editor.
export const STYLE_PATH_TO_CSS_VAR_INFIX = {
	'border.color': 'color',
	'color.background': 'color',
	'color.text': 'color',
	'elements.link.color.text': 'color',
	'elements.link.:hover.color.text': 'color',
	'elements.link.typography.fontFamily': 'font-family',
	'elements.link.typography.fontSize': 'font-size',
	'elements.button.color.text': 'color',
	'elements.button.color.background': 'color',
	'elements.button.typography.fontFamily': 'font-family',
	'elements.button.typography.fontSize': 'font-size',
	'elements.caption.color.text': 'color',
	'elements.heading.color': 'color',
	'elements.heading.color.background': 'color',
	'elements.heading.typography.fontFamily': 'font-family',
	'elements.heading.gradient': 'gradient',
	'elements.heading.color.gradient': 'gradient',
	'elements.h1.color': 'color',
	'elements.h1.color.background': 'color',
	'elements.h1.typography.fontFamily': 'font-family',
	'elements.h1.color.gradient': 'gradient',
	'elements.h2.color': 'color',
	'elements.h2.color.background': 'color',
	'elements.h2.typography.fontFamily': 'font-family',
	'elements.h2.color.gradient': 'gradient',
	'elements.h3.color': 'color',
	'elements.h3.color.background': 'color',
	'elements.h3.typography.fontFamily': 'font-family',
	'elements.h3.color.gradient': 'gradient',
	'elements.h4.color': 'color',
	'elements.h4.color.background': 'color',
	'elements.h4.typography.fontFamily': 'font-family',
	'elements.h4.color.gradient': 'gradient',
	'elements.h5.color': 'color',
	'elements.h5.color.background': 'color',
	'elements.h5.typography.fontFamily': 'font-family',
	'elements.h5.color.gradient': 'gradient',
	'elements.h6.color': 'color',
	'elements.h6.color.background': 'color',
	'elements.h6.typography.fontFamily': 'font-family',
	'elements.h6.color.gradient': 'gradient',
	'color.gradient': 'gradient',
	blockGap: 'spacing',
	'typography.fontSize': 'font-size',
	'typography.fontFamily': 'font-family',
};

// TODO: Temporary duplication of constant in @wordpress/block-editor. Can be
// removed by moving PushChangesToGlobalStylesControl to
// @wordpress/block-editor.
export const STYLE_PATH_TO_PRESET_BLOCK_ATTRIBUTE = {
	'border.color': 'borderColor',
	'color.background': 'backgroundColor',
	'color.text': 'textColor',
	'color.gradient': 'gradient',
	'typography.fontSize': 'fontSize',
	'typography.fontFamily': 'fontFamily',
};

export const getValueFromObjectPath = ( object, path ) => {
	let value = object;
	path.forEach( ( fieldName ) => {
		value = value?.[ fieldName ];
	} );
	return value;
};

/**
 * Reads the value a block has for a style path, preferring a preset block
 * attribute (e.g. `textColor`) over a custom value in `style`.
 *
 * A preset comes back in its user form (`var:preset|color|vivid-red`) so it
 * compares and displays the same way as the values in a change row.
 *
 * @param {Object}   attributes Block attributes.
 * @param {string[]} path       Style path, e.g. `[ 'color', 'text' ]`.
 *
 * @return {*} The value, or `undefined` when the block doesn't set one.
 */
export function getBlockStyleValue( attributes, path ) {
	const key = path.join( '.' );
	const presetAttributeName = STYLE_PATH_TO_PRESET_BLOCK_ATTRIBUTE[ key ];
	const presetAttributeValue = presetAttributeName
		? attributes?.[ presetAttributeName ]
		: undefined;

	if ( presetAttributeValue ) {
		return `var:preset|${ STYLE_PATH_TO_CSS_VAR_INFIX[ key ] }|${ presetAttributeValue }`;
	}

	return getValueFromObjectPath( attributes?.style, path );
}
