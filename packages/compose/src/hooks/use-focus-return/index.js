/**
 * WordPress dependencies
 */
import { useRef, useEffect } from '@wordpress/element';

function useFocusReturn( onFocusReturn ) {
	const ref = useRef();

	useEffect( () => {
		const ownerDocument = ref.current.ownerDocument;
		const focusedBeforeMount = ownerDocument.activeElement;

		return () => {
			if ( ! ref.current.contains( ownerDocument.activeElement ) ) {
				return;
			}

			// Defer to the component's own explicit focus return behavior,
			// if specified. This allows for support that the `onFocusReturn` decides to allow the
			// default behavior to occur under some conditions.
			if ( onFocusReturn ) {
				onFocusReturn();
				return;
			}

			if ( ownerDocument.contains( focusedBeforeMount ) ) {
				focusedBeforeMount.focus();
			}
		};
	}, [] );

	return ref;
}

export default useFocusReturn;
