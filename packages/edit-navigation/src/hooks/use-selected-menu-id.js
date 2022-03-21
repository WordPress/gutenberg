/**
 * WordPress dependencies
 */
import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import { store as preferencesStore } from '@wordpress/preferences';

/**
 * Returns selected menu ID and the setter.
 *
 * @return {[number, Function]} A tuple where first item is the
 *                              selected menu ID and second is
 *                              the setter.
 */
export default function useSelectedMenuId() {
	const selectedMenuId =
		useSelect(
			( select ) =>
				select( preferencesStore ).get(
					'core/edit-navigation',
					'selectedMenuId'
				),
			[]
		) ?? null;

	const { set } = useDispatch( preferencesStore );
	const setSelectedMenuId = useCallback(
		( menuId ) => set( 'core/edit-navigation', 'selectedMenuId', menuId ),
		[ set ]
	);

	return [ selectedMenuId, setSelectedMenuId ];
}
