/**
 * External dependencies
 */
import fastDeepEqual from 'fast-deep-equal/es6';

/**
 * Internal dependencies
 */
import {
	getTypographyFontSizeValue,
	getFluidTypographyOptionsFromSettings,
} from './typography-utils';
import { getValueFromObjectPath } from '../../utils/object';

/* Supporting data. */
export const ROOT_BLOCK_NAME = 'root';
export const ROOT_BLOCK_SELECTOR = 'body';
export const ROOT_BLOCK_SUPPORTS = [
	'background',
	'backgroundColor',
	'color',
	'linkColor',
	'captionColor',
	'buttonColor',
	'headingColor',
	'fontFamily',
	'fontSize',
	'fontStyle',
	'fontWeight',
	'lineHeight',
	'textDecoration',
	'textTransform',
	'padding',
];

export const PRESET_METADATA = [
	{
		path: [ 'color', 'palette' ],
		valueKey: 'color',
		cssVarInfix: 'color',
		classes: [
			{ classSuffix: 'color', propertyName: 'color' },
			{
				classSuffix: 'background-color',
				propertyName: 'background-color',
			},
			{
				classSuffix: 'border-color',
				propertyName: 'border-color',
			},
		],
	},
	{
		path: [ 'color', 'gradients' ],
		valueKey: 'gradient',
		cssVarInfix: 'gradient',
		classes: [
			{
				classSuffix: 'gradient-background',
				propertyName: 'background',
			},
		],
	},
	{
		path: [ 'color', 'duotone' ],
		valueKey: 'colors',
		cssVarInfix: 'duotone',
		valueFunc: ( { slug } ) => `url( '#wp-duotone-${ slug }' )`,
		classes: [],
	},
	{
		path: [ 'shadow', 'presets' ],
		valueKey: 'shadow',
		cssVarInfix: 'shadow',
		classes: [],
	},
	{
		path: [ 'typography', 'fontSizes' ],
		valueFunc: ( preset, settings ) =>
			getTypographyFontSizeValue(
				preset,
				getFluidTypographyOptionsFromSettings( settings )
			),
		valueKey: 'size',
		cssVarInfix: 'font-size',
		classes: [ { classSuffix: 'font-size', propertyName: 'font-size' } ],
	},
	{
		path: [ 'typography', 'fontFamilies' ],
		valueKey: 'fontFamily',
		cssVarInfix: 'font-family',
		classes: [
			{ classSuffix: 'font-family', propertyName: 'font-family' },
		],
	},
	{
		path: [ 'spacing', 'spacingSizes' ],
		valueKey: 'size',
		cssVarInfix: 'spacing',
		valueFunc: ( { size } ) => size,
		classes: [],
	},
];

export const STYLE_PATH_TO_CSS_VAR_INFIX = {
	'color.background': 'color',
	'color.text': 'color',
	'filter.duotone': 'duotone',
	'elements.link.color.text': 'color',
	'elements.link.:hover.color.text': 'color',
	'elements.link.typography.fontFamily': 'font-family',
	'elements.link.typography.fontSize': 'font-size',
	'elements.button.color.text': 'color',
	'elements.button.color.background': 'color',
	'elements.caption.color.text': 'color',
	'elements.button.typography.fontFamily': 'font-family',
	'elements.button.typography.fontSize': 'font-size',
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
	shadow: 'shadow',
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

export const TOOLSPANEL_DROPDOWNMENU_PROPS = {
	popoverProps: {
		placement: 'left-start',
		offset: 259, // Inner sidebar width (248px) - button width (24px) - border (1px) + padding (16px) + spacing (20px)
	},
};

function findInPresetsBy(
	features,
	blockName,
	presetPath,
	presetProperty,
	presetValueValue
) {
	// Block presets take priority above root level presets.
	const orderedPresetsByOrigin = [
		getValueFromObjectPath( features, [
			'blocks',
			blockName,
			...presetPath,
		] ),
		getValueFromObjectPath( features, presetPath ),
	];

	for ( const presetByOrigin of orderedPresetsByOrigin ) {
		if ( presetByOrigin ) {
			// Preset origins ordered by priority.
			const origins = [ 'custom', 'theme', 'default' ];
			for ( const origin of origins ) {
				const presets = presetByOrigin[ origin ];
				if ( presets ) {
					const presetObject = presets.find(
						( preset ) =>
							preset[ presetProperty ] === presetValueValue
					);
					if ( presetObject ) {
						if ( presetProperty === 'slug' ) {
							return presetObject;
						}
						// If there is a highest priority preset with the same slug but different value the preset we found was overwritten and should be ignored.
						const highestPresetObjectWithSameSlug = findInPresetsBy(
							features,
							blockName,
							presetPath,
							'slug',
							presetObject.slug
						);
						if (
							highestPresetObjectWithSameSlug[
								presetProperty
							] === presetObject[ presetProperty ]
						) {
							return presetObject;
						}
						return undefined;
					}
				}
			}
		}
	}
}

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

function getValueFromPresetVariable(
	features,
	blockName,
	variable,
	[ presetType, slug ]
) {
	const metadata = PRESET_METADATA.find(
		( data ) => data.cssVarInfix === presetType
	);
	if ( ! metadata ) {
		return variable;
	}

	const presetObject = findInPresetsBy(
		features.settings,
		blockName,
		metadata.path,
		'slug',
		slug
	);

	if ( presetObject ) {
		const { valueKey } = metadata;
		const result = presetObject[ valueKey ];
		return getValueFromVariable( features, blockName, result );
	}

	return variable;
}

function getValueFromCustomVariable( features, blockName, variable, path ) {
	const result =
		getValueFromObjectPath( features.settings, [
			'blocks',
			blockName,
			'custom',
			...path,
		] ) ??
		getValueFromObjectPath( features.settings, [ 'custom', ...path ] );
	if ( ! result ) {
		return variable;
	}
	// A variable may reference another variable so we need recursion until we find the value.
	return getValueFromVariable( features, blockName, result );
}

/**
 * Attempts to fetch the value of a theme.json CSS variable.
 *
 * @param {Object}   features  GlobalStylesContext config, e.g., user, base or merged. Represents the theme.json tree.
 * @param {string}   blockName The name of a block as represented in the styles property. E.g., 'root' for root-level, and 'core/${blockName}' for blocks.
 * @param {string|*} variable  An incoming style value. A CSS var value is expected, but it could be any value.
 * @return {string|*|{ref}} The value of the CSS var, if found. If not found, the passed variable argument.
 */
export function getValueFromVariable( features, blockName, variable ) {
	if ( ! variable || typeof variable !== 'string' ) {
		if ( variable?.ref && typeof variable?.ref === 'string' ) {
			const refPath = variable.ref.split( '.' );
			variable = getValueFromObjectPath( features, refPath );
			// Presence of another ref indicates a reference to another dynamic value.
			// Pointing to another dynamic value is not supported.
			if ( ! variable || !! variable?.ref ) {
				return variable;
			}
		} else {
			return variable;
		}
	}
	const USER_VALUE_PREFIX = 'var:';
	const THEME_VALUE_PREFIX = 'var(--wp--';
	const THEME_VALUE_SUFFIX = ')';

	let parsedVar;

	if ( variable.startsWith( USER_VALUE_PREFIX ) ) {
		parsedVar = variable.slice( USER_VALUE_PREFIX.length ).split( '|' );
	} else if (
		variable.startsWith( THEME_VALUE_PREFIX ) &&
		variable.endsWith( THEME_VALUE_SUFFIX )
	) {
		parsedVar = variable
			.slice( THEME_VALUE_PREFIX.length, -THEME_VALUE_SUFFIX.length )
			.split( '--' );
	} else {
		// We don't know how to parse the value: either is raw of uses complex CSS such as `calc(1px * var(--wp--variable) )`
		return variable;
	}

	const [ type, ...path ] = parsedVar;
	if ( type === 'preset' ) {
		return getValueFromPresetVariable(
			features,
			blockName,
			variable,
			path
		);
	}
	if ( type === 'custom' ) {
		return getValueFromCustomVariable(
			features,
			blockName,
			variable,
			path
		);
	}
	return variable;
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

/**
 * Appends a sub-selector to an existing one.
 *
 * Given the compounded `selector` "h1, h2, h3"
 * and the `toAppend` selector ".some-class" the result will be
 * "h1.some-class, h2.some-class, h3.some-class".
 *
 * @param {string} selector Original selector.
 * @param {string} toAppend Selector to append.
 *
 * @return {string} The new selector.
 */
export function appendToSelector( selector, toAppend ) {
	if ( ! selector.includes( ',' ) ) {
		return selector + toAppend;
	}
	const selectors = selector.split( ',' );
	const newSelectors = selectors.map( ( sel ) => sel + toAppend );
	return newSelectors.join( ',' );
}

/**
 * Compares global style variations according to their styles and settings properties.
 *
 * @example
 * ```js
 * const globalStyles = { styles: { typography: { fontSize: '10px' } }, settings: {} };
 * const variation = { styles: { typography: { fontSize: '10000px' } }, settings: {} };
 * const isEqual = areGlobalStyleConfigsEqual( globalStyles, variation );
 * // false
 * ```
 *
 * @param {Object} original  A global styles object.
 * @param {Object} variation A global styles object.
 *
 * @return {boolean} Whether `original` and `variation` match.
 */
export function areGlobalStyleConfigsEqual( original, variation ) {
	if ( typeof original !== 'object' || typeof variation !== 'object' ) {
		return original === variation;
	}
	return (
		fastDeepEqual( original?.styles, variation?.styles ) &&
		fastDeepEqual( original?.settings, variation?.settings )
	);
}

/**
 * Generates the selector for a block style variation by creating the
 * appropriate CSS class and adding it to the ancestor portion of the block's
 * selector.
 *
 * For example, take the Button block which has a compound selector:
 * `.wp-block-button .wp-block-button__link`. With a variation named 'custom',
 * the class `.is-style-custom` should be added to the `.wp-block-button`
 * ancestor only.
 *
 * This function will take into account comma separated and complex selectors.
 *
 * @param {string} variation     Name for the variation.
 * @param {string} blockSelector CSS selector for the block.
 *
 * @return {string} CSS selector for the block style variation.
 */
export function getBlockStyleVariationSelector( variation, blockSelector ) {
	const variationClass = `.is-style-${ variation }`;

	if ( ! blockSelector ) {
		return variationClass;
	}

	const ancestorRegex = /((?::\([^)]+\))?\s*)([^\s:]+)/;
	const addVariationClass = ( _match, group1, group2 ) => {
		return group1 + group2 + variationClass;
	};

	const result = blockSelector
		.split( ',' )
		.map( ( part ) => part.replace( ancestorRegex, addVariationClass ) );

	return result.join( ',' );
}
