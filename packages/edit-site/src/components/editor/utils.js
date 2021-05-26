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
		classes: [],
	},
];

const STYLE_PROPERTIES_TO_CSS_VAR_INFIX = {
	backgroundColor: 'color',
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

const filterColorsFromCoreOrigin = ( path, setting ) => {
	if ( path !== 'color.palette' && path !== 'color.gradients' ) {
		return setting;
	}

	if ( ! Array.isArray( setting ) ) {
		return setting;
	}

	const colors = setting.filter( ( color ) => color?.origin !== 'core' );

	return colors.length > 0 ? colors : setting;
};

export function useSetting( path, blockName = '' ) {
	const settings = useSelect( ( select ) => {
		return select( editSiteStore ).getSettings();
	} );
	const topLevelPath = `__experimentalFeatures.${ path }`;
	const blockPath = `__experimentalFeatures.blocks.${ blockName }.${ path }`;
	const setting = get( settings, blockPath ) ?? get( settings, topLevelPath );
	return filterColorsFromCoreOrigin( path, setting );
}

export function getPresetVariable( styles, context, propertyName, value ) {
	if ( ! value ) {
		return value;
	}

	const metadata = getPresetMetadataFromStyleProperty( propertyName );
	if ( ! metadata ) {
		// The property doesn't have preset data
		// so the value should be returned as it is.
		return value;
	}

	const basePath =
		ROOT_BLOCK_NAME === context
			? [ 'settings' ]
			: [ 'settings', 'blocks', context ];
	const { valueKey, path: propertyPath, cssVarInfix } = metadata;
	const presets = get( styles, [ ...basePath, ...propertyPath ] );
	const presetObject = find(
		presets,
		( preset ) => preset[ valueKey ] === value
	);
	if ( ! presetObject ) {
		// Value wasn't found in the presets,
		// so it must be a custom value.
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
	const metadata = getPresetMetadataFromStyleProperty( presetType );
	if ( ! metadata ) {
		return variable;
	}

	const presets =
		get( styles, [ 'settings', 'blocks', blockName, ...metadata.path ] ) ??
		get( styles, [ 'settings', ...metadata.path ] );
	if ( ! presets ) {
		return variable;
	}

	const presetObject = find( presets, ( preset ) => preset.slug === slug );
	if ( presetObject ) {
		const { valueKey } = metadata;
		const result = presetObject[ valueKey ];
		return getValueFromVariable( styles, blockName, result );
	}

	return variable;
}

function getValueFromCustomVariable( styles, blockName, variable, path ) {
	const result =
		get( styles, [ 'settings', 'blocks', blockName, 'custom', ...path ] ) ??
		get( styles, [ 'settings', 'custom', ...path ] );
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
		// Value is raw.
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
