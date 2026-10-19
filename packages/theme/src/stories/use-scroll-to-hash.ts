import { useEffect } from '@wordpress/element';

/**
 * Scrolls the element with the given id into view on mount when it matches the
 * URL hash of the Storybook manager window. Storybook's own scroll runs once
 * when the docs container mounts, which can be before this content exists.
 *
 * @param id Element id.
 */
export function useScrollToHash( id: string ) {
	useEffect( () => {
		let hash = '';
		try {
			hash = decodeURIComponent(
				window.parent.location.hash.replace( /^#/, '' )
			);
		} catch {
			// Cross-origin parent or malformed hash: nothing to scroll to.
			return;
		}
		if ( hash !== id ) {
			return;
		}
		const timeout = setTimeout( () => {
			document.getElementById( id )?.scrollIntoView( { block: 'start' } );
		}, 300 );
		return () => clearTimeout( timeout );
	}, [ id ] );
}
