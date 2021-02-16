/**
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../../store';

/** @typedef {import('@wordpress/element').RefObject} RefObject */

/**
 * Returns true when the block is hovered and in navigation or outline mode, false if not.
 *
 * @param {RefObject} ref React ref with the block element.
 * @param {string}    clientId Block client ID.
 *
 * @return {boolean} Hovered state.
 */
export function useIsHovered( ref, clientId ) {
	const { isHovered, isNavigationMode, isOutlineMode } = useSelect(
		( select ) => {
			const {
				isBlockHovered,
				isNavigationMode: selectIsNavigationMode,
				getSettings,
			} = select( blockEditorStore );

			return {
				isHovered: isBlockHovered( clientId ),
				isNavigationMode: selectIsNavigationMode(),
				isOutlineMode: getSettings().outlineMode,
			};
		},
		[]
	);

	const { toggleBlockHover } = useDispatch( blockEditorStore );

	function addHoverListener( eventType, value ) {
		function listener( event ) {
			if ( event.defaultPrevented ) {
				return;
			}

			event.preventDefault();
			toggleBlockHover( clientId, value );
		}

		ref.current.addEventListener( eventType, listener );
		return [ eventType, listener ];
	}

	function addHoverListeners() {
		const hoverListeners = [];

		hoverListeners.push( addHoverListener( 'mouseout', false ) );

		if ( isOutlineMode || isNavigationMode ) {
			hoverListeners.push( addHoverListener( 'mouseover', true ) );
		}

		return hoverListeners;
	}

	useEffect( () => {
		const hoverListeners = addHoverListeners();

		return () => {
			hoverListeners.forEach( ( [ eventType, listener ] ) =>
				ref.current.removeEventListener( eventType, listener )
			);
		};
	}, [ isOutlineMode, isNavigationMode ] );

	return isHovered;
}
