/**
 * WordPress dependencies
 */
import { useEffect, useState } from '@wordpress/element';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../../store';

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

	const { hasInnerBlocks, isNavigationMode, isOutlineMode } = useSelect(
		( select ) => {
			const {
				isNavigationMode: selectIsNavigationMode,
				getBlocks,
				getSettings,
			} = select( blockEditorStore );

			return {
				hasInnerBlocks: !! getBlocks( ref?.current?.dataset?.block )
					.length,
				isNavigationMode: selectIsNavigationMode(),
				isOutlineMode: getSettings().outlineMode,
			};
		},
		[]
	);

	function addHoverListener( eventType, value ) {
		function listener( event ) {
			if ( event.defaultPrevented ) {
				return;
			}

			event.preventDefault();
			setHovered( value );
		}

		ref.current.addEventListener( eventType, listener );
		return [ eventType, listener ];
	}

	function addHoverListeners() {
		const hoverListeners = [];

		if ( ! hasInnerBlocks ) {
			hoverListeners.push( addHoverListener( 'mouseleave', false ) );
		} else {
			hoverListeners.push( addHoverListener( 'mouseout', false ) );
		}

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
	}, [ isOutlineMode, isNavigationMode, hasInnerBlocks ] );

	return isHovered;
}
