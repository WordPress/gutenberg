/**
 * External dependencies
 */
import MicroModal from 'micromodal';

// Responsive navigation toggle.
function navigationToggleModal( modal ) {
	const dialogContainer = modal.querySelector(
		`.wp-block-navigation__responsive-dialog`
	);

	const isHidden = 'true' === modal.getAttribute( 'aria-hidden' );

	modal.classList.toggle( 'has-modal-open', ! isHidden );
	dialogContainer.toggleAttribute( 'aria-modal', ! isHidden );

	if ( isHidden ) {
		dialogContainer.removeAttribute( 'role' );
		dialogContainer.removeAttribute( 'aria-modal' );
	} else {
		dialogContainer.setAttribute( 'role', 'dialog' );
		dialogContainer.setAttribute( 'aria-modal', 'true' );
	}

	// Add a class to indicate the modal is open.
	const htmlElement = document.documentElement;
	htmlElement.classList.toggle( 'has-modal-open' );
}

window.addEventListener( 'load', () => {
	MicroModal.init( {
		onShow: navigationToggleModal,
		onClose: navigationToggleModal,
		openClass: 'is-menu-open',
	} );
} );
