/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { useRef, useEffect, useState } from '@wordpress/element';
import { ESCAPE, TAB } from '@wordpress/keycodes';
import { addQueryArgs } from '@wordpress/url';
import { __ } from '@wordpress/i18n';
import { wordpress } from '@wordpress/icons';

function AdminMenuToggle() {
	const { isOpen, toggleMenu } = useToggle( { ref: buttonRef } );
	const href = useAdminUrl();
	const buttonRef = useRef();

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

	const label = isOpen
		? __( 'Hide sidebar menu' )
		: __( 'Show sidebar menu' );

	return (
		<Button
			className="interface-admin-menu-toggle"
			href={ href }
			icon={ wordpress }
			iconSize={ 36 }
			label={ label }
			onClick={ handleOnClick }
			ref={ buttonRef }
		/>
	);
}

function useAdminUrl() {
	const { postType } = useSelect( ( select ) => {
		const { getCurrentPostType } = select( 'core/editor' );
		const { getPostType } = select( 'core' );

		return {
			postType: getPostType( getCurrentPostType() ),
		};
	}, [] );

	const href = addQueryArgs( 'edit.php', {
		post_type: postType?.slug,
	} );

	return href;
}

function useToggle( { ref } ) {
	const [ isOpen, setIsOpen ] = useState( false );
	const buttonNode = ref?.current;

	const adminMenuNode = document.querySelector( '#adminmenumain' );
	/**
	 * Grabs the first link within the Admin Menu.
	 * Used to refine the tab/shift+tab based keyboard navigation interactions
	 * between the Gutenberg Admin Menu toggle link and the WP-Admin sidebar
	 * menu.
	 */
	const firstAdminMenuLink = adminMenuNode.querySelector(
		'#adminmenu > li > a'
	);
	const toggleClassName = 'is-showing-admin-menu';

	const toggleMenu = () => setIsOpen( ! isOpen );
	const closeMenu = () => setIsOpen( false );

	const focusFirstAdminMenuItem = () => {
		if ( ! buttonNode ) return;

		const isButtonFocused = buttonNode.matches( ':focus' );

		if ( isButtonFocused && firstAdminMenuLink ) {
			firstAdminMenuLink.focus();
		}
	};

	// Renders the open/closed UI for the admin menu
	useEffect( () => {
		if ( isOpen ) {
			document.body.classList.add( toggleClassName );
		} else {
			document.body.classList.remove( toggleClassName );
		}
	}, [ isOpen ] );

	// Handles closing the admin menu when clicking outside
	useEffect( () => {
		const handleOnClickOutside = ( event ) => {
			if ( ! isOpen ) return;

			const { target } = event;

			const didClickOutside =
				! adminMenuNode.contains( target ) &&
				! buttonNode.contains( target ) &&
				target !== buttonNode;

			if ( didClickOutside ) {
				closeMenu();
			}
		};

		document.body.addEventListener( 'click', handleOnClickOutside );

		return () => {
			document.body.removeEventListener( 'click', handleOnClickOutside );
		};
	}, [ isOpen, buttonNode ] );

	// Handles admin menu keyboard interactions
	useEffect( () => {
		const handleOnKeyDown = ( event ) => {
			if ( ! isOpen ) return;

			const { keyCode } = event;

			if ( keyCode === ESCAPE ) {
				closeMenu();
			}

			if ( keyCode === TAB ) {
				focusFirstAdminMenuItem();
			}
		};

		const handleOnFirstAdminMenuLinkBlur = ( event ) => {
			/**
			 * This mechanism jumps the focus from the WP-Admin menu back to
			 * the Gutenberg toolbar when shift+tab is pressed.
			 *
			 * It does this by listening for the next focus item. If the next
			 * focus item is an anchor for the Toolbar (displays "Skip to toolbar"),
			 * then we intercept it and redirect the focus to the Gutenberg
			 * Admin Menu toggle.
			 *
			 * The solution isn't ideal. However, this is probably the best
			 * way to handle interactions bridging between the React powered
			 * Gutenberg editor and the non-React rendered WP-Admin interface.
			 *
			 * More details regarding this interaction can be found in this
			 * pull request:
			 * https://github.com/WordPress/gutenberg/pull/22191
			 */
			const toolbarAnchorLink = '#wp-toolbar';
			if (
				event.relatedTarget.getAttribute( 'href' ) === toolbarAnchorLink
			) {
				event.preventDefault();
				buttonNode.focus();
			}
		};

		document.body.addEventListener( 'keydown', handleOnKeyDown );

		/**
		 * Add special blur handling for shift+tab keyboard navigation
		 * interactions for the WP-Admin menu.
		 */
		firstAdminMenuLink.addEventListener(
			'blur',
			handleOnFirstAdminMenuLinkBlur
		);

		return () => {
			document.body.removeEventListener( 'keydown', handleOnKeyDown );
			firstAdminMenuLink.removeEventListener(
				'blur',
				handleOnFirstAdminMenuLinkBlur
			);
		};
	}, [ isOpen ] );

	return { isOpen, toggleMenu };
}

export default AdminMenuToggle;
