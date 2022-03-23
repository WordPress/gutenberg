/**
 * External dependencies
 */
import { castArray, without } from 'lodash';

/**
 * WordPress dependencies
 */
import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import { store as preferencesStore } from '@wordpress/preferences';

const EMPTY_ARRAY = [];

export default function useHiddenBlockTypes( scope ) {
	const hiddenBlockTypes = useSelect(
		( select ) =>
			select( preferencesStore ).get( scope, 'hiddenBlockTypes' ) ??
			EMPTY_ARRAY
	);

	const { set } = useDispatch( preferencesStore );

	const showBlockTypes = useCallback(
		( blockNames ) => {
			const newBlockNames = without(
				hiddenBlockTypes,
				...castArray( blockNames )
			);

			set( scope, 'hiddenBlockTypes', newBlockNames );
		},
		[ scope, hiddenBlockTypes ]
	);

	const hideBlockTypes = useCallback(
		( blockNames ) => {
			const mergedBlockNames = new Set( [
				...hiddenBlockTypes,
				...castArray( blockNames ),
			] );

			set( scope, 'hiddenBlockTypes', [ ...mergedBlockNames ] );
		},
		[ scope, hiddenBlockTypes ]
	);

	return { hiddenBlockTypes, showBlockTypes, hideBlockTypes };
}
