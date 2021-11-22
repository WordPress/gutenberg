/**
 * External dependencies
 */
import { get, find, isString } from 'lodash';

/* Supporting data */
export const ROOT_BLOCK_NAME = 'root';
export const ROOT_BLOCK_SELECTOR = 'body';
export const ROOT_BLOCK_SUPPORTS = [
	'background',
	'backgroundColor',
	'color',
	'linkColor',
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
		path: [ 'typography', 'fontSizes' ],
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
];

const STYLE_PATH_TO_CSS_VAR_INFIX = {
	'color.background': 'color',
	'color.text': 'color',
	'elements.link.color.text': 'color',
	'color.gradient': 'gradient',
	'typography.fontSize': 'font-size',
	'typography.fontFamily': 'font-family',
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
		get( features, [ 'blocks', blockName, ...presetPath ] ),
		get( features, presetPath ),
	];

	for ( const presetByOrigin of orderedPresetsByOrigin ) {
		if ( presetByOrigin ) {
			// Preset origins ordered by priority.
			const origins = [ 'custom', 'theme', 'default' ];
			for ( const origin of origins ) {
				const presets = presetByOrigin[ origin ];
				if ( presets ) {
					const presetObject = find(
						presets,
						( preset ) =>
							preset[ presetProperty ] === presetValueValue
					);
					if ( presetObject ) {
						if ( presetProperty === 'slug' ) {
							return presetObject;
						}
						// if there is a highest priority preset with the same slug but different value the preset we found was overwritten and should be ignored.
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

	const metadata = find( PRESET_METADATA, [ 'cssVarInfix', cssVarInfix ] );

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
	const metadata = find( PRESET_METADATA, [ 'cssVarInfix', presetType ] );
	if ( ! metadata ) {
		return variable;
	}

	const presetObject = findInPresetsBy(
		features,
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
		get( features, [ 'blocks', blockName, 'custom', ...path ] ) ??
		get( features, [ 'custom', ...path ] );
	if ( ! result ) {
		return variable;
	}
	// A variable may reference another variable so we need recursion until we find the value.
	return getValueFromVariable( features, blockName, result );
}

export function getValueFromVariable( features, blockName, variable ) {
	if ( ! variable || ! isString( variable ) ) {
		return variable;
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
