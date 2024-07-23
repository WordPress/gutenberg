/**
 * WordPress dependencies
 */
import {
	__EXPERIMENTAL_PATHS_WITH_OVERRIDE as PATHS_WITH_OVERRIDE,
	hasBlockSupport,
} from '@wordpress/blocks';
import { applyFilters } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import { getValueFromObjectPath } from '../utils/object';
import { getBlockName, getSettings, getBlockAttributes } from './selectors';

const blockedPaths = [
	'color',
	'border',
	'dimensions',
	'typography',
	'spacing',
];

const deprecatedFlags = {
	'color.palette': ( settings ) => settings.colors,
	'color.gradients': ( settings ) => settings.gradients,
	'color.custom': ( settings ) =>
		settings.disableCustomColors === undefined
			? undefined
			: ! settings.disableCustomColors,
	'color.customGradient': ( settings ) =>
		settings.disableCustomGradients === undefined
			? undefined
			: ! settings.disableCustomGradients,
	'typography.fontSizes': ( settings ) => settings.fontSizes,
	'typography.customFontSize': ( settings ) =>
		settings.disableCustomFontSizes === undefined
			? undefined
			: ! settings.disableCustomFontSizes,
	'typography.lineHeight': ( settings ) => settings.enableCustomLineHeight,
	'spacing.units': ( settings ) => {
		if ( settings.enableCustomUnits === undefined ) {
			return;
		}

		if ( settings.enableCustomUnits === true ) {
			return [ 'px', 'em', 'rem', 'vh', 'vw', '%' ];
		}

		return settings.enableCustomUnits;
	},
	'spacing.padding': ( settings ) => settings.enableCustomSpacing,
};

const prefixedFlags = {
	/*
	 * These were only available in the plugin
	 * and can be removed when the minimum WordPress version
	 * for the plugin is 5.9.
	 */
	'border.customColor': 'border.color',
	'border.customStyle': 'border.style',
	'border.customWidth': 'border.width',
	'typography.customFontStyle': 'typography.fontStyle',
	'typography.customFontWeight': 'typography.fontWeight',
	'typography.customLetterSpacing': 'typography.letterSpacing',
	'typography.customTextDecorations': 'typography.textDecoration',
	'typography.customTextTransforms': 'typography.textTransform',
	/*
	 * These were part of WordPress 5.8 and we need to keep them.
	 */
	'border.customRadius': 'border.radius',
	'spacing.customMargin': 'spacing.margin',
	'spacing.customPadding': 'spacing.padding',
	'typography.customLineHeight': 'typography.lineHeight',
};

/**
 * Remove `custom` prefixes for flags that did not land in 5.8.
 *
 * This provides continued support for `custom` prefixed properties. It will
 * be removed once third party devs have had sufficient time to update themes,
 * plugins, etc.
 *
 * @see https://github.com/WordPress/gutenberg/pull/34485
 *
 * @param {string} path Path to desired value in settings.
 * @return {string}     The value for defined setting.
 */
const removeCustomPrefixes = ( path ) => {
	return prefixedFlags[ path ] || path;
};

export function getBlockSettings( state, clientId, ...paths ) {
	const blockName = getBlockName( state, clientId );
	const candidates = [];

	if ( clientId ) {
		let id = clientId;
		do {
			const name = getBlockName( state, id );
			if ( hasBlockSupport( name, '__experimentalSettings', false ) ) {
				candidates.push( id );
			}
		} while ( ( id = state.blocks.parents.get( id ) ) );
	}

	return paths.map( ( path ) => {
		if ( blockedPaths.includes( path ) ) {
			// eslint-disable-next-line no-console
			console.warn(
				'Top level useSetting paths are disabled. Please use a subpath to query the information needed.'
			);
			return undefined;
		}

		// 0. Allow third parties to filter the block's settings at runtime.
		let result = applyFilters(
			'blockEditor.useSetting.before',
			undefined,
			path,
			clientId,
			blockName
		);

		if ( undefined !== result ) {
			return result;
		}

		const normalizedPath = removeCustomPrefixes( path );

		// 1. Take settings from the block instance or its ancestors.
		// Start from the current block and work our way up the ancestors.
		for ( const candidateClientId of candidates ) {
			const candidateAtts = getBlockAttributes(
				state,
				candidateClientId
			);
			result =
				getValueFromObjectPath(
					candidateAtts.settings?.blocks?.[ blockName ],
					normalizedPath
				) ??
				getValueFromObjectPath(
					candidateAtts.settings,
					normalizedPath
				);
			if ( result !== undefined ) {
				// Stop the search for more distant ancestors and move on.
				break;
			}
		}

		// 2. Fall back to the settings from the block editor store (__experimentalFeatures).
		const settings = getSettings( state );
		if ( result === undefined && blockName ) {
			result = getValueFromObjectPath(
				settings.__experimentalFeatures?.blocks?.[ blockName ],
				normalizedPath
			);
		}

		if ( result === undefined ) {
			result = getValueFromObjectPath(
				settings.__experimentalFeatures,
				normalizedPath
			);
		}

		// Return if the setting was found in either the block instance or the store.
		if ( result !== undefined ) {
			if ( PATHS_WITH_OVERRIDE[ normalizedPath ] ) {
				return result.custom ?? result.theme ?? result.default;
			}
			return result;
		}

		// 3. Otherwise, use deprecated settings.
		const deprecatedSettingsValue =
			deprecatedFlags[ normalizedPath ]?.( settings );
		if ( deprecatedSettingsValue !== undefined ) {
			return deprecatedSettingsValue;
		}

		// 4. Fallback for typography.dropCap:
		// This is only necessary to support typography.dropCap.
		// when __experimentalFeatures are not present (core without plugin).
		// To remove when __experimentalFeatures are ported to core.
		return normalizedPath === 'typography.dropCap' ? true : undefined;
	} );
}
