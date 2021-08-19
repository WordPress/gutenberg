/**
 * External dependencies
 */
import { get  } from 'lodash';
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

const PATHS_WITH_MERGE = {
	'color.gradients': true,
	'color.palette': true,
	'typography.fontFamilies': true,
	'typography.fontSizes': true,
};

export function useSetting( path, blockName = '' ) {
	const settings = useSelect( ( select ) => {
		return select( editSiteStore ).getSettings();
	} );
	const topLevelPath = `__experimentalFeatures.${ path }`;
	const blockPath = `__experimentalFeatures.blocks.${ blockName }.${ path }`;
	const result = get( settings, blockPath ) ?? get( settings, topLevelPath );
	if ( result && PATHS_WITH_MERGE[ path ] ) {
		return result.user ?? result.theme ?? result.core;
	}
	return result;
}
