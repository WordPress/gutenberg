/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { Button } from '@wordpress/components';
import { useRef, useEffect, useState } from '@wordpress/element';
import { ESCAPE, DOWN } from '@wordpress/keycodes';
import { __ } from '@wordpress/i18n';
import { wordpress } from '@wordpress/icons';

function FullscreenModeClose() {
	const buttonRef = useRef();
	const toggleAdminMenu = useToggleAdminMenu( { ref: buttonRef } );

	const { isActive, postType } = useSelect( ( select ) => {
		const { getCurrentPostType } = select( 'core/editor' );
		const { isFeatureActive } = select( 'core/edit-post' );
		const { getPostType } = select( 'core' );

		return {
			isActive: isFeatureActive( 'fullscreenMode' ),
			postType: getPostType( getCurrentPostType() ),
		};
	}, [] );

	if ( ! isActive || ! postType ) {
		return null;
	}

	return (
		<Button
			className="edit-post-fullscreen-mode-close"
			icon={ wordpress }
			iconSize={ 36 }
			onClick={ toggleAdminMenu }
			label={ __( 'Show sidebar menu' ) }
			ref={ buttonRef }
		/>
	);
}

function useToggleAdminMenu( { ref } ) {
	const [ isActive, setIsActive ] = useState( false );

	const navigationHeaderNode = document.querySelector( '.edit-post-header' );
	const adminMenuNode = document.querySelector( '#adminmenumain' );

	const toggleClassName = 'is-showing-admin-menu';

	const toggleAdminMenu = () => setIsActive( ! isActive );
	const closeAdminMenu = () => setIsActive( false );

	const focusFirstAdminMenuItem = () => {
		const buttonNode = ref.current;
		if ( ! buttonNode ) return;

		const isButtonFocused = buttonNode.matches( ':focus' );
		const item = adminMenuNode.querySelector( '#adminmenu > li > a' );

		if ( isButtonFocused && item ) {
			item.focus();
		}
	};

	// Renders the open/closed UI for the admin menu
	useEffect( () => {
		if ( isActive ) {
			document.body.classList.add( toggleClassName );
		} else {
			document.body.classList.remove( toggleClassName );
		}
	}, [ isActive ] );

	// Handles closing the admin menu when clicking outside
	useEffect( () => {
		const handleOnClickOutside = ( event ) => {
			const { target } = event;

			const didClickOutsideNavigationHeader =
				! navigationHeaderNode.contains( target ) &&
				target !== navigationHeaderNode;

			const didClickOutsideAdminMenu =
				! adminMenuNode.contains( target ) && target !== adminMenuNode;

			const didClickOutside =
				didClickOutsideNavigationHeader && didClickOutsideAdminMenu;

			if ( didClickOutside ) {
				closeAdminMenu();
			}
		};

		if ( isActive ) {
			document.body.addEventListener( 'click', handleOnClickOutside );
		}

		return () => {
			if ( isActive ) {
				document.body.removeEventListener(
					'click',
					handleOnClickOutside
				);
			}
		};
	}, [ isActive ] );

	// Handles closing the admin menu when pressing ESCAPE or DOWN
	useEffect( () => {
		const handleOnKeyDown = ( event ) => {
			const { keyCode } = event;

			if ( keyCode === ESCAPE ) {
				closeAdminMenu();
			}

			if ( keyCode === DOWN ) {
				focusFirstAdminMenuItem();
			}
		};

		if ( isActive ) {
			document.body.addEventListener( 'keydown', handleOnKeyDown );
		}

		return () => {
			if ( isActive ) {
				document.body.removeEventListener( 'keydown', handleOnKeyDown );
			}
		};
	}, [ isActive ] );

	return toggleAdminMenu;
}

export default FullscreenModeClose;
