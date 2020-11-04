/**
 * External dependencies
 */
import { get, find } from 'lodash';
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
	textTransform: { path: [ 'typography', 'textTransforms' ], key: 'slug' },
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

export function getPresetValueFromVariable(
	presetCategory,
	presets,
	variable
) {
	if ( ! variable ) {
		return;
	}
	const slug = variable.slice( variable.lastIndexOf( '|' ) + 1 );
	const presetObject = find( presets, ( preset ) => {
		return preset.slug === slug;
	} );
	if ( presetObject ) {
		const presetData = PRESET_CATEGORIES[ presetCategory ];
		const { key } = presetData;
		return presetObject[ key ];
	}
}
