/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';

export function useRouter() {
	return useMemo(
		() => ( {
			location: { isBack: false, isInitial: false, skipFocus: false },
		} ),
		[]
	);
}
