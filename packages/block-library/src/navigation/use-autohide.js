/**
 * WordPress dependencies
 */
import { useEffect, useState } from '@wordpress/element';

export function useAutohide( navElement, wrappedElementsContainer ) {
	const [ isWrapping, setIsWrapping ] = useState( false );

	useEffect( () => {
		if ( navElement && wrappedElementsContainer ) {
			let timeout;

			const { bottom } = navElement.current.getBoundingClientRect();

			function handleResize() {
				if ( timeout ) {
					window.cancelAnimationFrame( timeout );
				}

				timeout = window.requestAnimationFrame( () => {
					const items = Array.from( navElement.current.childNodes ); // i need to work in terms of react component
					// Using the rendered DOM nodes does not allow me to alter props.
					// I would also like to use react in order to move the components around.
					// I can do this by storing arrays of elements.
					// Moving the elements from the main container to the wrapped elements container is actually easier with react. cool.

					const hasWrappedElements = items.some( ( el ) => {
						const isBelowBottom =
							el.getBoundingClientRect().y >= bottom;

						// @todo: move this side effect elsewhere.
						el.classList.toggle( 'wrapped', isBelowBottom );

						const elementCopy = el.cloneNode( true );

						if ( isBelowBottom ) {
							wrappedElementsContainer.append( elementCopy );
						}

						return isBelowBottom;
					} );

					setIsWrapping( hasWrappedElements );
				} );
			}

			window.addEventListener( 'resize', handleResize, false );

			handleResize();

			return () => {
				// remove resize listener
				if ( navElement ) {
					window.removeEventListener( 'resize', handleResize );
				}
			};
		}
	}, [ navElement, wrappedElementsContainer ] );

	return [ isWrapping ];
}
