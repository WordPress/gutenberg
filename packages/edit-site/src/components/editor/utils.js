/**
 * External dependencies
 */
import { get, find, camelCase, isString } from 'lodash';
/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';

/* Supporting data */
export const GLOBAL_CONTEXT = 'global';
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
export const LINK_COLOR = '--wp--style--color--link';
export const LINK_COLOR_DECLARATION = `a { color: var(${ LINK_COLOR }, #00e); }`;

export function useEditorFeature( featurePath, blockName = GLOBAL_CONTEXT ) {
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
			`__experimentalFeatures.${ GLOBAL_CONTEXT }.${ featurePath }`
		)
	);
}

export function getPresetVariable( presetCategory, presets, value ) {
	if ( ! value ) {
		return;
	}
	const presetData = PRESET_CATEGORIES[ presetCategory ];
	const { key } = presetData;
	const presetObject = find( presets, ( preset ) => {
		return preset[ key ] === value;
	} );
	return (
		presetObject && `var:preset|${ presetCategory }|${ presetObject.slug }`
	);
}

function getValueFromPresetVariable(
	features,
	blockName,
	[ presetType, slug ]
) {
	presetType = camelCase( presetType );
	const presetData = PRESET_CATEGORIES[ presetType ];
	if ( ! presetData ) {
		return;
	}
	const presets =
		get( features, [ blockName, ...presetData.path ] ) ??
		get( features, [ GLOBAL_CONTEXT, ...presetData.path ] );
	if ( ! presets ) {
		return;
	}
	const presetObject = find( presets, ( preset ) => {
		return preset.slug === slug;
	} );
	if ( presetObject ) {
		const { key } = presetData;
		const result = presetObject[ key ];
		return getValueFromVariable( features, blockName, result ) || result;
	}
}

function getValueFromCustomVariable( features, blockName, path ) {
	const result =
		get( features, [ blockName, 'custom', ...path ] ) ??
		get( features, [ GLOBAL_CONTEXT, 'custom', ...path ] );
	// A variable may reference another variable so we need recursion until we find the value.
	return getValueFromVariable( features, blockName, result ) || result;
}

export function getValueFromVariable( features, blockName, variable ) {
	if ( ! variable || ! isString( variable ) ) {
		return;
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
		return;
	}

	const [ type, ...path ] = parsedVar;
	if ( type === 'preset' ) {
		return getValueFromPresetVariable( features, blockName, path );
	}
	if ( type === 'custom' ) {
		return getValueFromCustomVariable( features, blockName, path );
	}
}
