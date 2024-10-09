/**
 * External dependencies
 */
import { isPlainObject } from 'is-plain-object';
import { isValidElementType } from 'react-is';

/**
 * WordPress dependencies
 */
import deprecated from '@wordpress/deprecated';
import { applyFilters } from '@wordpress/hooks';
import warning from '@wordpress/warning';

/**
 * Internal dependencies
 */
import { isValidIcon, normalizeIconObject, omit } from '../api/utils';
import { BLOCK_ICON_DEFAULT, DEPRECATED_ENTRY_KEYS } from '../api/constants';

/** @typedef {import('../api/registration').WPBlockType} WPBlockType */

/**
 * Mapping of legacy category slugs to their latest normal values, used to
 * accommodate updates of the default set of block categories.
 *
 * @type {Record<string,string>}
 */
const LEGACY_CATEGORY_MAPPING = {
	common: 'text',
	formatting: 'text',
	layout: 'design',
};

/**
 * Merge block variations bootstrapped from the server and client.
 *
 * When a variation is registered in both places, its properties are merged.
 *
 * @param {Array} bootstrappedVariations - A block type variations from the server.
 * @param {Array} clientVariations       - A block type variations from the client.
 * @return {Array} The merged array of block variations.
 */
function mergeBlockVariations(
	bootstrappedVariations = [],
	clientVariations = []
) {
	const result = [ ...bootstrappedVariations ];

	clientVariations.forEach( ( clientVariation ) => {
		const index = result.findIndex(
			( bootstrappedVariation ) =>
				bootstrappedVariation.name === clientVariation.name
		);

		if ( index !== -1 ) {
			result[ index ] = { ...result[ index ], ...clientVariation };
		} else {
			result.push( clientVariation );
		}
	} );

	return result;
}
function handleExperimentalBorder( rawSupports ) {
	if ( ! rawSupports ) {
		return rawSupports;
	}

	const supports = { ...rawSupports };

	if (
		supports?.__experimentalBorder &&
		typeof supports.__experimentalBorder === 'object'
	) {
		supports.border = supports.__experimentalBorder;
	}

	return supports;
}
/**
 * Takes the unprocessed block type settings, merges them with block type metadata
 * and applies all the existing filters for the registered block type.
 * Next, it validates all the settings and performs additional processing to the block type definition.
 *
 * @param {string}      name          Block name.
 * @param {WPBlockType} blockSettings Unprocessed block type settings.
 *
 * @return {WPBlockType | undefined} The block, if it has been processed and can be registered; otherwise `undefined`.
 */
export const processBlockType =
	( name, blockSettings ) =>
	( { select } ) => {
		const bootstrappedBlockType = select.getBootstrappedBlockType( name );

		const blockType = {
			name,
			icon: BLOCK_ICON_DEFAULT,
			keywords: [],
			attributes: {},
			providesContext: {},
			usesContext: [],
			selectors: {},
			supports: {},
			styles: [],
			blockHooks: {},
			save: () => null,
			...bootstrappedBlockType,
			...blockSettings,
			// blockType.variations can be defined as a filePath.
			variations: mergeBlockVariations(
				Array.isArray( bootstrappedBlockType?.variations )
					? bootstrappedBlockType.variations
					: [],
				Array.isArray( blockSettings?.variations )
					? blockSettings.variations
					: []
			),
		};
		blockType.supports = handleExperimentalBorder( blockType.supports );

		const settings = applyFilters(
			'blocks.registerBlockType',
			blockType,
			name,
			null
		);
		blockType.supports = handleExperimentalBorder( blockType.supports );

		if (
			settings.description &&
			typeof settings.description !== 'string'
		) {
			deprecated( 'Declaring non-string block descriptions', {
				since: '6.2',
			} );
		}

		if ( settings.deprecated ) {
			settings.deprecated = settings.deprecated.map( ( deprecation ) => {
				deprecation.supports = handleExperimentalBorder(
					deprecation.supports
				);

				const filteredDeprecation = applyFilters(
					'blocks.registerBlockType',
					{
						...omit( blockType, DEPRECATED_ENTRY_KEYS ),
						...deprecation,
					},
					blockType.name,
					deprecation
				);
				filteredDeprecation.supports = handleExperimentalBorder(
					filteredDeprecation.supports
				);

				return Object.fromEntries(
					Object.entries( filteredDeprecation ).filter( ( [ key ] ) =>
						DEPRECATED_ENTRY_KEYS.includes( key )
					)
				);
			} );
		}

		if ( ! isPlainObject( settings ) ) {
			warning( 'Block settings must be a valid object.' );
			return;
		}

		if ( typeof settings.save !== 'function' ) {
			warning( 'The "save" property must be a valid function.' );
			return;
		}
		if ( 'edit' in settings && ! isValidElementType( settings.edit ) ) {
			warning( 'The "edit" property must be a valid component.' );
			return;
		}

		// Canonicalize legacy categories to equivalent fallback.
		if ( LEGACY_CATEGORY_MAPPING.hasOwnProperty( settings.category ) ) {
			settings.category = LEGACY_CATEGORY_MAPPING[ settings.category ];
		}

		if (
			'category' in settings &&
			! select
				.getCategories()
				.some( ( { slug } ) => slug === settings.category )
		) {
			warning(
				'The block "' +
					name +
					'" is registered with an invalid category "' +
					settings.category +
					'".'
			);
			delete settings.category;
		}

		if ( ! ( 'title' in settings ) || settings.title === '' ) {
			warning( 'The block "' + name + '" must have a title.' );
			return;
		}
		if ( typeof settings.title !== 'string' ) {
			warning( 'Block titles must be strings.' );
			return;
		}

		settings.icon = normalizeIconObject( settings.icon );
		if ( ! isValidIcon( settings.icon.src ) ) {
			warning(
				'The icon passed is invalid. ' +
					'The icon should be a string, an element, a function, or an object following the specifications documented in https://developer.wordpress.org/block-editor/developers/block-api/block-registration/#icon-optional'
			);
			return;
		}

		return settings;
	};
