/**
 * WordPress dependencies
 */
import { useEffect, useState } from '@wordpress/element';
import { useSelect } from '@wordpress/data';

/** @typedef {import('@wordpress/element').RefObject} RefObject */

/**
 * Returns true when the block is hovered and in navigation mode, false if not.
 *
 * @param {RefObject} ref React ref with the block element.
 *
 * @return {boolean} Hovered state.
 */
export function useIsHovered( ref ) {
	const [ isHovered, setHovered ] = useState( false );
	const isNavigationMode = useSelect(
		( select ) => select( 'core/block-editor' ).isNavigationMode(),
		[]
	);

	useEffect( () => {
		if ( ! isNavigationMode ) {
			return;
		}

		function addListener( eventType, value ) {
			function listener( event ) {
				if ( event.defaultPrevented ) {
					return;
				}

				event.preventDefault();
				setHovered( value );
			}

			ref.current.addEventListener( eventType, listener );
			return () => {
				ref.current.removeEventListener( eventType, listener );
			};
		}

		if ( isHovered ) {
			return addListener( 'mouseout', false );
		}

		return addListener( 'mouseover', true );
	}, [ isNavigationMode, isHovered, setHovered ] );

	return isHovered;
}
