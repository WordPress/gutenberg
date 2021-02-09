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

	const { isNavigationMode, isOutlineMode } = useSelect( ( select ) => {
		const {
			isNavigationMode: selectIsNavigationMode,
			getSettings,
		} = select( blockEditorStore );

		return {
			isNavigationMode: selectIsNavigationMode(),
			isOutlineMode: getSettings().outlineMode,
		};
	}, [] );

	const hasInnerBlocks = useSelect(
		( select ) => {
			if ( ref?.current?.dataset ) {
				return (
					select( 'core/block-editor' ).getBlocks(
						ref?.current?.dataset?.block
					).length > 0
				);
			}

			return false;
		},
		[ ref?.current?.dataset ]
	);

	useEffect( () => {
		function addListener( eventType, value ) {
			function listener( event ) {
				if ( event.defaultPrevented ) {
					return;
				}

				event.stopPropagation();
				event.preventDefault();
				setHovered( value );
			}

			ref.current.addEventListener( eventType, listener );
			return () => {
				ref.current.removeEventListener( eventType, listener );
			};
		}

		if ( isHovered ) {
			if ( ! hasInnerBlocks ) {
				return addListener( 'mouseleave', false );
			}
			return addListener( 'mouseout', false );
		}

		if ( isOutlineMode || isNavigationMode ) {
			return addListener( 'mouseover', true );
		}
	}, [ isNavigationMode, isOutlineMode, isHovered, setHovered ] );

	return isHovered;
}
