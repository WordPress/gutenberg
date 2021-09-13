/**
 * External dependencies
 */
import MicroModal from 'micromodal';

// Responsive navigation toggle.
function navigationToggleModal( modal ) {
	const triggerButton = document.querySelector(
		`button[data-micromodal-trigger="${ modal.id }"]`
	);
	const closeButton = modal.querySelector( 'button[data-micromodal-close]' );
	// Use aria-hidden to determine the status of the modal, as this attribute is
	// managed by micromodal.
	const isHidden = 'true' === modal.getAttribute( 'aria-hidden' );
	triggerButton.setAttribute( 'aria-expanded', ! isHidden );
	closeButton.setAttribute( 'aria-expanded', ! isHidden );
	modal.classList.toggle( 'has-modal-open', ! isHidden );

	// Add a class to indicate the modal is open.
	const htmlElement = document.documentElement;
	htmlElement.classList.toggle( 'has-modal-open' );
}

MicroModal.init( {
	onShow: navigationToggleModal,
	onClose: navigationToggleModal,
	openClass: 'is-menu-open',
} );

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

const submenuButtons = document.querySelectorAll(
	'.wp-block-navigation-submenu__toggle'
);

submenuButtons.forEach( function ( button ) {
	button.addEventListener( 'click', toggleSubmenuOnClick );
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
