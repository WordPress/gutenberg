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

function isLinkToAnchorOnCurrentPage( node ) {
	return (
		node.hash &&
		node.protocol === window.location.protocol &&
		node.host === window.location.host &&
		node.pathname === window.location.pathname &&
		node.search === window.location.search
	);
}

window.addEventListener( 'load', () => {
	MicroModal.init( {
		onShow: navigationToggleModal,
		onClose: navigationToggleModal,
		openClass: 'is-menu-open',
	} );

	// Close modal automatically on clicking anchor links inside modal.
	const navigationLinks = document.querySelectorAll(
		'.wp-block-navigation-item__content'
	);

	navigationLinks.forEach( function ( link ) {
		// Ignore non-anchor links and anchor links which open on a new tab.
		if (
			! isLinkToAnchorOnCurrentPage( link ) ||
			link.attributes?.target === '_blank'
		) {
			return;
		}

		// Find the specific parent modal for this link
		// since .close() won't work without an ID if there are
		// multiple navigation menus in a post/page.
		const modal = link.closest(
			'.wp-block-navigation__responsive-container'
		);
		const modalId = modal?.getAttribute( 'id' );

		link.addEventListener( 'click', () => {
			// check if modal exists and is open before trying to close it
			// otherwise Micromodal will toggle the `has-modal-open` class
			// on the html tag which prevents scrolling
			if ( modalId && modal.classList.contains( 'has-modal-open' ) ) {
				MicroModal.close( modalId );
			}
		} );
	} );
} );
