/**
 * External dependencies
 */
import { pickBy, isEqual, isObject, identity, mapValues, map } from 'lodash';

/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { useCallback, useMemo } from '@wordpress/element';
import { removeInvalidHTML } from '@wordpress/dom';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../store';

/**
 * Removed undefined values from nested object.
 *
 * @param {*} object
 * @return {*} Object cleaned from undefined values
 */
export const cleanEmptyObject = ( object ) => {
	if ( ! isObject( object ) ) {
		return object;
	}
	const cleanedNestedObjects = pickBy(
		mapValues( object, cleanEmptyObject ),
		identity
	);
	return isEqual( cleanedNestedObjects, {} )
		? undefined
		: cleanedNestedObjects;
};

export const useKsesSanitization = ( allowedHtmlTags ) => {
	const canUserUseUnfilteredHTML = useSelect(
		( select ) =>
			select( blockEditorStore ).getSettings()
				.__experimentalCanUserUseUnfilteredHTML
	);
	const schema = useMemo( () => allowedTagsToKsesSchema( allowedHtmlTags ), [
		allowedHtmlTags,
	] );

	return useCallback(
		function ( unfilteredHTML ) {
			if ( canUserUseUnfilteredHTML ) {
				return unfilteredHTML;
			}
			return removeInvalidHTML( unfilteredHTML, schema, {
				inline: true,
			} );
		},
		[ canUserUseUnfilteredHTML, schema ]
	);
};

/**
 * Returns all the available block types.
 *
 * @param {string} allowedHtmlTags Allowed HTML Tags.
 * @return {Array} Block Types.
 */
export const allowedTagsToKsesSchema = ( allowedHtmlTags ) => {
	const schema = {
		'#text': {},
	};
	for ( const tagName of Object.keys( allowedHtmlTags ) ) {
		schema[ tagName ] = {
			attributes: map( allowedHtmlTags[ tagName ], ( enabled, attr ) => [
				attr,
				enabled,
			] )
				.filter( ( [ , enabled ] ) => enabled )
				.map( ( [ attr ] ) => attr ),
		};
		if ( ! [ '#text', 'br' ].includes( tagName ) ) {
			schema[ tagName ].children = schema;
		}
	}

	return schema;
};
