/**
 * WordPress dependencies
 */
import { useState, useEffect } from '@wordpress/element';

export default function useClientWidth( ref ) {
	const [ clientWidth, setClientWidth ] = useState();
	function calculateClientWidth() {
		setClientWidth( ref.current?.clientWidth );
	}

	useEffect( calculateClientWidth );
	useEffect( () => {
		const { defaultView } = ref.current.ownerDocument;

		defaultView.addEventListener( 'resize', calculateClientWidth );

		return () => {
			defaultView.removeEventListener( 'resize', calculateClientWidth );
		};
	}, [] );

	return clientWidth;
}
