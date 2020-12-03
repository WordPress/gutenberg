/**
 * External dependencies
 */
import { get, find, camelCase, kebabCase, isString } from 'lodash';
/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';

/* Supporting data */
export const GLOBAL_CONTEXT_NAME = 'global';
export const GLOBAL_CONTEXT_SELECTOR = ':root';
export const GLOBAL_CONTEXT_SUPPORTS = [
	'--wp--style--color--link',
	'background',
	'backgroundColor',
	'color',
	'fontFamily',
	'fontSize',
	'fontStyle',
	'fontWeight',
	'lineHeight',
	'textDecoration',
	'textTransform',
];

export const PRESET_CATEGORIES = {
	color: { path: [ 'color', 'palette' ], key: 'color' },
	gradient: { path: [ 'color', 'gradients' ], key: 'gradient' },
	fontSize: { path: [ 'typography', 'fontSizes' ], key: 'size' },
	fontFamily: { path: [ 'typography', 'fontFamilies' ], key: 'fontFamily' },
	fontStyle: { path: [ 'typography', 'fontStyles' ], key: 'slug' },
	fontWeight: { path: [ 'typography', 'fontWeights' ], key: 'slug' },
	textDecoration: { path: [ 'typography', 'textDecorations' ], key: 'value' },
	textTransform: { path: [ 'typography', 'textTransforms' ], key: 'slug' },
};
export const PRESET_CLASSES = {
	color: { ...PRESET_CATEGORIES.color, property: 'color' },
	'background-color': {
		...PRESET_CATEGORIES.color,
		property: 'background-color',
	},
	'gradient-background': {
		...PRESET_CATEGORIES.gradient,
		property: 'background',
	},
	'font-size': {
		...PRESET_CATEGORIES.fontSize,
		property: 'font-size',
	},
};

const STYLE_PROPERTIES_TO_PRESETS = {
	backgroundColor: 'color',
	LINK_COLOR: 'color',
	background: 'gradient',
};

export const LINK_COLOR = '--wp--style--color--link';
export const LINK_COLOR_DECLARATION = `a { color: var(${ LINK_COLOR }, #00e); }`;

export function useEditorFeature(
	featurePath,
	blockName = GLOBAL_CONTEXT_NAME
) {
	const settings = useSelect( ( select ) => {
		return select( 'core/edit-site' ).getSettings();
	} );
	return (
		get(
			settings,
			`__experimentalFeatures.${ blockName }.${ featurePath }`
		) ??
		get(
			settings,
			`__experimentalFeatures.${ GLOBAL_CONTEXT_NAME }.${ featurePath }`
		)
	);
}

export function getPresetVariable( styles, blockName, propertyName, value ) {
	if ( ! value ) {
		return value;
	}
	const presetCategory =
		STYLE_PROPERTIES_TO_PRESETS[ propertyName ] || propertyName;
	if ( ! presetCategory ) {
		return value;
	}
	const presetData = PRESET_CATEGORIES[ presetCategory ];
	if ( ! presetData ) {
		return value;
	}
	const { key, path } = presetData;
	const presets =
		get( styles, [ blockName, 'settings', ...path ] ) ??
		get( styles, [ GLOBAL_CONTEXT_NAME, 'settings', ...path ] );
	const presetObject = find( presets, ( preset ) => {
		return preset[ key ] === value;
	} );
	if ( ! presetObject ) {
		return value;
	}
	return `var:preset|${ kebabCase( presetCategory ) }|${ presetObject.slug }`;
}

function getValueFromPresetVariable(
	styles,
	blockName,
	variable,
	[ presetType, slug ]
) {
	presetType = camelCase( presetType );
	const presetData = PRESET_CATEGORIES[ presetType ];
	if ( ! presetData ) {
		return variable;
	}
	const presets =
		get( styles, [ blockName, 'settings', ...presetData.path ] ) ??
		get( styles, [ GLOBAL_CONTEXT_NAME, 'settings', ...presetData.path ] );
	if ( ! presets ) {
		return variable;
	}
	const presetObject = find( presets, ( preset ) => {
		return preset.slug === slug;
	} );
	if ( presetObject ) {
		const { key } = presetData;
		const result = presetObject[ key ];
		return getValueFromVariable( styles, blockName, result );
	}
	return variable;
}

function getValueFromCustomVariable( styles, blockName, variable, path ) {
	const result =
		get( styles, [ blockName, 'settings', 'custom', ...path ] ) ??
		get( styles, [ GLOBAL_CONTEXT_NAME, 'settings', 'custom', ...path ] );
	if ( ! result ) {
		return variable;
	}
	// A variable may reference another variable so we need recursion until we find the value.
	return getValueFromVariable( styles, blockName, result );
}

export function getValueFromVariable( styles, blockName, variable ) {
	if ( ! variable || ! isString( variable ) ) {
		return variable;
	}
	let parsedVar;
	const INTERNAL_REFERENCE_PREFIX = 'var:';
	const CSS_REFERENCE_PREFIX = 'var(--wp--';
	const CSS_REFERENCE_SUFFIX = ')';
	if ( variable.startsWith( INTERNAL_REFERENCE_PREFIX ) ) {
		parsedVar = variable
			.slice( INTERNAL_REFERENCE_PREFIX.length )
			.split( '|' );
	} else if (
		variable.startsWith( CSS_REFERENCE_PREFIX ) &&
		variable.endsWith( CSS_REFERENCE_SUFFIX )
	) {
		parsedVar = variable
			.slice( CSS_REFERENCE_PREFIX.length, -CSS_REFERENCE_SUFFIX.length )
			.split( '--' );
	} else {
		return variable;
	}

	const [ type, ...path ] = parsedVar;
	if ( type === 'preset' ) {
		return getValueFromPresetVariable( styles, blockName, variable, path );
	}
	if ( type === 'custom' ) {
		return getValueFromCustomVariable( styles, blockName, variable, path );
	}
	return variable;
}
