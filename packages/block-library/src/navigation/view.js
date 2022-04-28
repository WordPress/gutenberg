// Open on click functionality.
function closeSubmenus( element ) {
	element
		.querySelectorAll( '[aria-expanded="true"]' )
		.forEach( function ( toggle ) {
			toggle.setAttribute( 'aria-expanded', 'false' );
		} );
}

function toggleSubmenuOnClick( event ) {
	const buttonToggle = event.target.closest( '[aria-expanded]' );
	const isSubmenuOpen = buttonToggle.getAttribute( 'aria-expanded' );

	if ( isSubmenuOpen === 'true' ) {
		closeSubmenus( buttonToggle.closest( '.wp-block-navigation-item' ) );
	} else {
		// Close all sibling submenus.
		const parentElement = buttonToggle.closest(
			'.wp-block-navigation-item'
		);
		const navigationParent = buttonToggle.closest(
			'.wp-block-navigation__submenu-container, .wp-block-navigation__container, .wp-block-page-list'
		);
		navigationParent
			.querySelectorAll( '.wp-block-navigation-item' )
			.forEach( function ( child ) {
				if ( child !== parentElement ) {
					closeSubmenus( child );
				}
			} );
		// Open submenu.
		buttonToggle.setAttribute( 'aria-expanded', 'true' );
	}
}

// Necessary for some themes such as TT1 Blocks, where
// scripts could be loaded before the body.
window.addEventListener( 'load', () => {
	const submenuButtons = document.querySelectorAll(
		'.wp-block-navigation-submenu__toggle'
	);

	submenuButtons.forEach( function ( button ) {
		button.addEventListener( 'click', toggleSubmenuOnClick );
	} );

	// Close modal automatically on clicking anchor links inside modal.
	const navigationLinks = document.querySelectorAll(
		'.wp-block-navigation-item__content'
	);

	navigationLinks.forEach( function ( link ) {
		// Ignore non-anchor links.
		if ( ! link.getAttribute( 'href' )?.startsWith( '#' ) ) {
			return;
		}

		// we need to find the specific parent modal for this link
		// since .close() won't work without an ID in case we have
		// mutiple navigation menus in a post/page.
		const modal = link.closest(
			'.wp-block-navigation__responsive-container'
		);
		const modalId = modal?.getAttribute( 'id' );

		link.addEventListener( 'click', () => {
			// check if modal exists and is open before we try to close it
			// otherwise Micromodal will toggle the `has-modal-open` class
			// on the html tag which prevents scrolling
			if ( modalId && modal.classList.contains( 'has-modal-open' ) ) {
				MicroModal.close( modalId );
			}
		} );
	} );

	// Close on click outside.
	document.addEventListener( 'click', function ( event ) {
		const navigationBlocks = document.querySelectorAll(
			'.wp-block-navigation'
		);
		navigationBlocks.forEach( function ( block ) {
			if ( ! block.contains( event.target ) ) {
				closeSubmenus( block );
			}
		} );
	} );
	// Close on focus outside.
	document.addEventListener( 'keyup', function ( event ) {
		const submenuBlocks = document.querySelectorAll(
			'.wp-block-navigation-item.has-child'
		);
		submenuBlocks.forEach( function ( block ) {
			if ( ! block.contains( event.target ) ) {
				closeSubmenus( block );
			}
		} );
	} );
} );
