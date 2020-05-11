/**
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';

export default function useGlobalEvent( ref, ...args ) {
	const dependencies = args.pop();

	useEffect( () => {
		const { defaultView } = ref.current.ownerDocument;

		defaultView.addEventListener( ...args );

		return () => {
			defaultView.removeEventListener( ...args );
		};
	}, dependencies );
}
