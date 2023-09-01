/*eslint-env browser*/
/**
 * External dependencies
 */
import MicroModal from 'micromodal';

// Responsive navigation toggle.

/**
 * Toggles responsive navigation.
 *
 * @param {HTMLDivElement} modal
 * @param {boolean}        isHidden
 */
function navigationToggleModal( modal, isHidden ) {
	const dialogContainer = modal.querySelector(
		`.wp-block-navigation__responsive-dialog`
	);

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
	document.documentElement.classList.toggle( 'has-modal-open' );
}

/**
 * Checks whether the provided link is an anchor on the current page.
 *
 * @param {HTMLAnchorElement} node
 * @return {boolean} Is anchor.
 */
function isLinkToAnchorOnCurrentPage( node ) {
	return (
		node.hash &&
		node.protocol === window.location.protocol &&
		node.host === window.location.host &&
		node.pathname === window.location.pathname &&
		node.search === window.location.search
	);
}

/**
 * Handles effects after opening the modal.
 *
 * @param {HTMLDivElement} modal
 */
function onShow( modal ) {
	navigationToggleModal( modal, false );
	modal.addEventListener( 'click', handleAnchorLinkClicksInsideModal, {
		passive: true,
	} );
}

/**
 * Handles effects after closing the modal.
 *
 * @param {HTMLDivElement} modal
 */
function onClose( modal ) {
	navigationToggleModal( modal, true );
	modal.removeEventListener( 'click', handleAnchorLinkClicksInsideModal, {
		passive: true,
	} );
}

/**
 * Handle clicks to anchor links in modal using event delegation by closing modal automatically
 *
 * @param {UIEvent} event
 */
function handleAnchorLinkClicksInsideModal( event ) {
	const link = event.target.closest( '.wp-block-navigation-item__content' );
	if ( ! ( link instanceof HTMLAnchorElement ) ) {
		return;
	}

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
	const modal = link.closest( '.wp-block-navigation__responsive-container' );
	const modalId = modal?.getAttribute( 'id' );
	if ( ! modalId ) {
		return;
	}

	// check if modal exists and is open before trying to close it
	// otherwise Micromodal will toggle the `has-modal-open` class
	// on the html tag which prevents scrolling
	if ( modalId && modal.classList.contains( 'has-modal-open' ) ) {
		MicroModal.close( modalId );
	}
}

// MicroModal.init() does not support event delegation for the open trigger, so here MicroModal.show() is called manually.
document.addEventListener(
	'click',
	( event ) => {
		/** @type {HTMLElement} */
		const target = event.target;

		if ( target.dataset.micromodalTrigger ) {
			MicroModal.show( target.dataset.micromodalTrigger, {
				onShow,
				onClose,
				openClass: 'is-menu-open',
			} );
		}
	},
	{ passive: true }
);
