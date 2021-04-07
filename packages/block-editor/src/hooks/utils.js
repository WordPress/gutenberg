/**
 * External dependencies
 */
import { pickBy, isEqual, isObject, identity, mapValues } from 'lodash';

/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
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

export const useKsesSanitization = () => {
	const { canUserUseUnfilteredHTML, schema } = useSelect( ( select ) => {
		const { getSettings, getKsesSchema } = select( blockEditorStore );
		return {
			canUserUseUnfilteredHTML: getSettings()
				.__experimentalCanUserUseUnfilteredHTML,
			schema: getKsesSchema(),
		};
	} );

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
