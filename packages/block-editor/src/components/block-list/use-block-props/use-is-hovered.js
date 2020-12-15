/**
 * WordPress dependencies
 */
import { useEffect, useState } from '@wordpress/element';
import { useSelect } from '@wordpress/data';

/** @typedef {import('@wordpress/element').RefObject} RefObject */

/**
 * Returns true when the block is hovered and in navigation or outline mode, false if not.
 *
 * @param {RefObject} ref React ref with the block element.
 *
 * @return {boolean} Hovered state.
 */
export function useIsHovered( ref ) {
	const [ isHovered, setHovered ] = useState( false );

	const { isNavigationMode, isOutlineMode } = useSelect( ( select ) => {
		const {
			isNavigationMode: selectIsNavigationMode,
			getSettings,
		} = select( 'core/block-editor' );

		return {
			isNavigationMode: selectIsNavigationMode(),
			isOutlineMode: getSettings().outlineMode,
		};
	}, [] );

	useEffect( () => {
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

		if ( isOutlineMode || isNavigationMode ) {
			return addListener( 'mouseover', true );
		}
	}, [ isNavigationMode, isOutlineMode, isHovered, setHovered ] );

	return isHovered;
}
