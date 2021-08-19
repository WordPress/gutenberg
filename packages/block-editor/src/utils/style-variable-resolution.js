/**
 * External dependencies
 */
import { get, find, isString, kebabCase } from 'lodash';

/**
 * WordPress dependencies
 */
import { __EXPERIMENTAL_PRESET_METADATA as PRESET_METADATA } from '@wordpress/blocks';

const STYLE_PROPERTIES_TO_CSS_VAR_INFIX = {
	linkColor: 'color',
	backgroundColor: 'color',
	background: 'gradient',
};

function findInPresetsBy(
	features,
	context,
	presetPath,
	presetProperty,
	presetValueValue
) {
	// Block presets take priority above root level presets.
	const orderedPresetsByOrigin = [
		get( features, [ 'blocks', context, ...presetPath ] ),
		get( features, presetPath ),
	];
	for ( const presetByOrigin of orderedPresetsByOrigin ) {
		if ( presetByOrigin ) {
			// Preset origins ordered by priority.
			const origins = [ 'user', 'theme', 'core' ];
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
							context,
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
		return getResolvedStyleVariable( features, blockName, result );
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
	return getResolvedStyleVariable( features, blockName, result );
}

export function getResolvedStyleVariable( features, context, variable ) {
	if ( ! variable || ! isString( variable ) ) {
		return variable;
	}
	const INTERNAL_REFERENCE_PREFIX = 'var:';
	const CSS_REFERENCE_PREFIX = 'var(--wp--';
	const CSS_REFERENCE_SUFFIX = ')';

	let parsedVar;

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
		return getValueFromPresetVariable( features, context, variable, path );
	}
	if ( type === 'custom' ) {
		return getValueFromCustomVariable( features, context, variable, path );
	}
	return variable;
}

export function getPresetVariableRepresentingAValue(
	features,
	context,
	propertyName,
	value
) {
	if ( ! value ) {
		return value;
	}

	const cssVarInfix =
		STYLE_PROPERTIES_TO_CSS_VAR_INFIX[ propertyName ] ||
		kebabCase( propertyName );

	const metadata = find( PRESET_METADATA, [ 'cssVarInfix', cssVarInfix ] );
	if ( ! metadata ) {
		// The property doesn't have preset data
		// so the value should be returned as it is.
		return value;
	}
	const { valueKey, path } = metadata;

	const presetObject = findInPresetsBy(
		features,
		context,
		path,
		valueKey,
		value
	);

	if ( ! presetObject ) {
		// Value wasn't found in the presets,
		// so it must be a custom value.
		return value;
	}

	return `var:preset|${ cssVarInfix }|${ presetObject.slug }`;
}
