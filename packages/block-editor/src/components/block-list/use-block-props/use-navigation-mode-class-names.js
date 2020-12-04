/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useEffect, useState } from '@wordpress/element';
import { useSelect } from '@wordpress/data';

/** @typedef {import('@wordpress/element').RefObject} RefObject */

/**
 * Returns true when the block is hovered and in navigation mode, false if not.
 *
 * @param {RefObject} ref      React ref with the block element.
 * @param {string}    clientId Block client ID.
 *
 * @return {boolean} Hovered state.
 */
export function useNavigationModeClassNames( ref, clientId ) {
	const [ isHovered, setHovered ] = useState( false );
	const { isNavMode, isSelected } = useSelect(
		( select ) => {
			const { isNavigationMode, isBlockSelected } = select(
				'core/block-editor'
			);

			return {
				isSelected: isBlockSelected( clientId ),
				isNavMode: isNavigationMode(),
			};
		},
		[ clientId ]
	);

	useEffect( () => {
		if ( ! isNavMode ) {
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
	}, [ isNavMode, isHovered, setHovered ] );

	if ( ! isNavMode ) {
		return;
	}

	return classnames( {
		'is-hovered': isHovered,
		'is-navigate-mode': isSelected,
	} );
}
