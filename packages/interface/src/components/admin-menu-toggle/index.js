/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
import { useRef, useEffect, useState } from '@wordpress/element';
import { ESCAPE, TAB } from '@wordpress/keycodes';
import { __ } from '@wordpress/i18n';
import { wordpress } from '@wordpress/icons';

function AdminMenuToggle() {
	const buttonRef = useRef();
	const toggleMenu = useToggle( { ref: buttonRef } );
	// Get the current WP Admin Post URL
	const href = window.location.href;

	const handleOnClick = ( event ) => {
		const { button, ctrlKey, metaKey } = event;
		const isMiddleClick = button === 2;

		/**
		 * Enables the ability to open the link in a new tab by middle clicking,
		 * or clicking while holding Command (Mac) or Control.
		 */
		if ( isMiddleClick || ctrlKey || metaKey ) {
			return;
		}

		/**
		 * Otherwise, toggle the admin menu.
		 */
		event.preventDefault();
		toggleMenu();
	};

	return (
		<Button
			className="interface-admin-menu-toggle"
			href={ href }
			icon={ wordpress }
			iconSize={ 36 }
			label={ __( 'Show sidebar menu' ) }
			onClick={ handleOnClick }
			ref={ buttonRef }
		/>
	);
}

function useToggle( { ref } ) {
	const [ isActive, setIsActive ] = useState( false );
	const buttonNode = ref?.current;

	const adminMenuNode = document.querySelector( '#adminmenumain' );

	const toggleClassName = 'is-showing-admin-menu';

	const toggleAdminMenu = () => setIsActive( ! isActive );
	const closeAdminMenu = () => setIsActive( false );

	const focusFirstAdminMenuItem = () => {
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
			if ( ! isActive ) return;

			const { target } = event;

			const didClickOutside =
				! adminMenuNode.contains( target ) && target !== buttonNode;

			if ( didClickOutside ) {
				closeAdminMenu();
			}
		};

		document.body.addEventListener( 'click', handleOnClickOutside );

		return () => {
			document.body.removeEventListener( 'click', handleOnClickOutside );
		};
	}, [ isActive, buttonNode ] );

	// Handles admin menu keyboard interactions
	useEffect( () => {
		const handleOnKeyDown = ( event ) => {
			if ( ! isActive ) return;

			const { keyCode } = event;

			if ( keyCode === ESCAPE ) {
				closeAdminMenu();
			}

			if ( keyCode === TAB ) {
				focusFirstAdminMenuItem();
			}
		};

		document.body.addEventListener( 'keydown', handleOnKeyDown );

		return () => {
			document.body.removeEventListener( 'keydown', handleOnKeyDown );
		};
	}, [ isActive ] );

	return toggleAdminMenu;
}

export default AdminMenuToggle;
