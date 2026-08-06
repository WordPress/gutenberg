/**
 * WordPress dependencies
 */
import { useDispatch, useSelect } from '@wordpress/data';
import { useEffect } from '@wordpress/element';
import { privateApis as editorPrivateApis } from '@wordpress/editor';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';

const { interfaceStore } = unlock( editorPrivateApis );

/**
 * Registers a visible welcome guide with the interface store so that other
 * editor UI, such as the "Choose a pattern" modal, can wait for the guide to be
 * dismissed before showing itself.
 *
 * @param {boolean} isVisible Whether the guide is currently on screen.
 */
export default function useRegisterWelcomeGuide( isVisible ) {
	const { openModal, closeModal } = useDispatch( interfaceStore );
	const { isModalActive } = useSelect( interfaceStore );

	useEffect( () => {
		if ( ! isVisible ) {
			return;
		}

		openModal( 'editor/welcome-guide' );

		return () => {
			// Only close if another modal hasn't taken over in the meantime.
			if ( isModalActive( 'editor/welcome-guide' ) ) {
				closeModal();
			}
		};
	}, [ isVisible, openModal, closeModal, isModalActive ] );
}
