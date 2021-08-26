/**
 * External dependencies
 */
import { isFunction, isPlainObject, omit, pick, some } from 'lodash';

/**
 * WordPress dependencies
 */
import { createRegistryControl } from '@wordpress/data';
import { applyFilters } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import { isValidIcon, normalizeIconObject } from '../api/utils';
import { DEPRECATED_ENTRY_KEYS } from '../api/constants';

const { error, warn } = window.console;

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

function processBlockType( blockType, select ) {
	const { name } = blockType;

	const settings = applyFilters(
		'blocks.registerBlockType',
		{ ...blockType },
		name
	);

	if ( settings.deprecated ) {
		settings.deprecated = settings.deprecated.map( ( deprecation ) =>
			pick(
				// Only keep valid deprecation keys.
				applyFilters(
					'blocks.registerBlockType',
					// Merge deprecation keys with pre-filter settings
					// so that filters that depend on specific keys being
					// present don't fail.
					{
						// Omit deprecation keys here so that deprecations
						// can opt out of specific keys like "supports".
						...omit( blockType, DEPRECATED_ENTRY_KEYS ),
						...deprecation,
					},
					name
				),
				DEPRECATED_ENTRY_KEYS
			)
		);
	}

	if ( ! isPlainObject( settings ) ) {
		error( 'Block settings must be a valid object.' );
		return;
	}

	if ( ! isFunction( settings.save ) ) {
		error( 'The "save" property must be a valid function.' );
		return;
	}
	if ( 'edit' in settings && ! isFunction( settings.edit ) ) {
		error( 'The "edit" property must be a valid function.' );
		return;
	}

	// Canonicalize legacy categories to equivalent fallback.
	if ( LEGACY_CATEGORY_MAPPING.hasOwnProperty( settings.category ) ) {
		settings.category = LEGACY_CATEGORY_MAPPING[ settings.category ];
	}

	if (
		'category' in settings &&
		! some( select( 'core/blocks' ).getCategories(), {
			slug: settings.category,
		} )
	) {
		warn(
			'The block "' +
				name +
				'" is registered with an invalid category "' +
				settings.category +
				'".'
		);
		delete settings.category;
	}

	if ( ! ( 'title' in settings ) || settings.title === '' ) {
		error( 'The block "' + name + '" must have a title.' );
		return;
	}
	if ( typeof settings.title !== 'string' ) {
		error( 'Block titles must be strings.' );
		return;
	}

	settings.icon = normalizeIconObject( settings.icon );
	if ( ! isValidIcon( settings.icon.src ) ) {
		error(
			'The icon passed is invalid. ' +
				'The icon should be a string, an element, a function, or an object following the specifications documented in https://developer.wordpress.org/block-editor/developers/block-api/block-registration/#icon-optional'
		);
		return;
	}

	return settings;
}

const controls = {
	ADD_PROCESSED_BLOCK_TYPE: createRegistryControl(
		( { dispatch, select } ) => ( { blockType } ) => {
			const settings = processBlockType( blockType, select );
			if ( ! settings ) {
				return;
			}

			dispatch( 'core/blocks' ).addBlockTypes( settings );
		}
	),
};

export default controls;
