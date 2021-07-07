/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as editNavigationStore } from '../store';

/**
 * Returns selected menu ID and the setter.
 *
 * @return {[number, Function]} A tuple where first item is the
 *                              selected menu ID and second is
 *                              the setter.
 */
export default function useSelectedMenuId() {
	const selectedMenuId = useSelect(
		( select ) => select( editNavigationStore ).getSelectedMenuId(),
		[]
	);
	const { setSelectedMenuId } = useDispatch( editNavigationStore );

	return [ selectedMenuId, setSelectedMenuId ];
}
