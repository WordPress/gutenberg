/**
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';

/**
 * Adds a listener to the containing window.
 *
 * @param {Object} ref          A reference with a node that is contained by the
 *                              window.
 * @param {Array}  args         `addEventListener` arguments.
 * @param {Array}  dependencies Hook dependencies.
 */
export default function useGlobalEvent( ref, args, dependencies ) {
	useEffect( () => {
		const { defaultView } = ref.current.ownerDocument;

		defaultView.addEventListener( ...args );

		return () => {
			defaultView.removeEventListener( ...args );
		};
	}, dependencies );
}
