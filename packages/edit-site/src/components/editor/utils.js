/**
 * External dependencies
 */
import { get, find, forEach, camelCase, isString } from 'lodash';
/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
/**
 * Internal dependencies
 */
import { store as editSiteStore } from '../../store';

/* Supporting data */
export const ALL_BLOCKS_NAME = 'defaults';
export const ALL_BLOCKS_SELECTOR = ':root';
export const ROOT_BLOCK_NAME = 'root';
export const ROOT_BLOCK_SELECTOR = ':root';
export const ROOT_BLOCK_SUPPORTS = [
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
		classes: [],
	},
];

const STYLE_PROPERTIES_TO_CSS_VAR_INFIX = {
	backgroundColor: 'color',
	LINK_COLOR: 'color',
	background: 'gradient',
};

function getPresetMetadataFromStyleProperty( styleProperty ) {
	if ( ! getPresetMetadataFromStyleProperty.MAP ) {
		getPresetMetadataFromStyleProperty.MAP = {};
		PRESET_METADATA.forEach( ( { cssVarInfix }, index ) => {
			getPresetMetadataFromStyleProperty.MAP[ camelCase( cssVarInfix ) ] =
				PRESET_METADATA[ index ];
		} );
		forEach( STYLE_PROPERTIES_TO_CSS_VAR_INFIX, ( value, key ) => {
			getPresetMetadataFromStyleProperty.MAP[ key ] =
				getPresetMetadataFromStyleProperty.MAP[ value ];
		} );
	}
	return getPresetMetadataFromStyleProperty.MAP[ styleProperty ];
}

export const LINK_COLOR = '--wp--style--color--link';
export const LINK_COLOR_DECLARATION = `a { color: var(${ LINK_COLOR }, #00e); }`;

export function useEditorFeature( featurePath, blockName = ALL_BLOCKS_NAME ) {
	const settings = useSelect( ( select ) => {
		return select( editSiteStore ).getSettings();
	} );
	return (
		get(
			settings,
			`__experimentalFeatures.${ blockName }.${ featurePath }`
		) ??
		get(
			settings,
			`__experimentalFeatures.${ ALL_BLOCKS_NAME }.${ featurePath }`
		)
	);
}

export function getPresetVariable( styles, blockName, propertyName, value ) {
	if ( ! value ) {
		return value;
	}
	const presetData = getPresetMetadataFromStyleProperty( propertyName );
	if ( ! presetData ) {
		return value;
	}
	const { valueKey, path, cssVarInfix } = presetData;
	const presets =
		get( styles, [ blockName, ...path ] ) ??
		get( styles, [ ALL_BLOCKS_NAME, ...path ] );
	const presetObject = find( presets, ( preset ) => {
		return preset[ valueKey ] === value;
	} );
	if ( ! presetObject ) {
		return value;
	}
	return `var:preset|${ cssVarInfix }|${ presetObject.slug }`;
}

function getValueFromPresetVariable(
	styles,
	blockName,
	variable,
	[ presetType, slug ]
) {
	presetType = camelCase( presetType );
	const presetData = getPresetMetadataFromStyleProperty( presetType );
	if ( ! presetData ) {
		return variable;
	}
	const presets =
		get( styles, [ blockName, ...presetData.path ] ) ??
		get( styles, [ ALL_BLOCKS_NAME, ...presetData.path ] );
	if ( ! presets ) {
		return variable;
	}
	const presetObject = find( presets, ( preset ) => {
		return preset.slug === slug;
	} );
	if ( presetObject ) {
		const { valueKey } = presetData;
		const result = presetObject[ valueKey ];
		return getValueFromVariable( styles, blockName, result );
	}
	return variable;
}

function getValueFromCustomVariable( styles, blockName, variable, path ) {
	const result =
		get( styles, [ blockName, 'settings', 'custom', ...path ] ) ??
		get( styles, [ ALL_BLOCKS_NAME, 'settings', 'custom', ...path ] );
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
