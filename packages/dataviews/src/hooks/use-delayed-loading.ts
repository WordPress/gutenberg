import { useEffect, useState } from '@wordpress/element';

export function useDelayedLoading(
	isLoading: boolean,
	options: { delay: number } = { delay: 400 }
): boolean {
	const [ showLoader, setShowLoader ] = useState( false );
	useEffect( () => {
		if ( ! isLoading ) {
			return;
		}
		const timeout = setTimeout( () => {
			setShowLoader( true );
		}, options.delay );
		return () => {
			clearTimeout( timeout );
			setShowLoader( false );
		};
	}, [ isLoading, options.delay ] );
	return showLoader;
}
