/**
 * WordPress dependencies
 */
import {
	store,
	getContext,
	getElement,
	withScope,
	withSyncEvent,
} from '@wordpress/interactivity';

function addDialogIdToUrl( id ) {
	const url = new URL( window.location.href );
	url.hash = id;
	// Update the URL without adding to history
	window.history.replaceState( {}, '', url );
}

function removeDialogIdFromUrl() {
	const url = new URL( window.location.href );
	url.hash = '';
	// Update the URL without adding to history
	window.history.replaceState( {}, '', url );
}

function createReadOnlyProxy( obj ) {
	return new Proxy( obj, {
		get( target, prop ) {
			const value = target[ prop ];
			if ( typeof value === 'object' && value !== null ) {
				return createReadOnlyProxy( value );
			}
			return value;
		},
		set() {
			return false;
		},
		deleteProperty() {
			return false;
		},
	} );
}

// Private store - locked and contains all internal implementation details
const { actions: privateActions, state: privateState } = store(
	'core/dialog/private',
	{
		state: {
			dialogs: {},
			get id() {
				const context = getContext();
				return context?.id;
			},
			get dialog() {
				return privateState.dialogs[ privateState.id ];
			},
			get dialogElement() {
				const { id } = getContext();
				return document.getElementById( id );
			},
		},
		actions: {
			/**
			 * Helper function to close all open dialogs.
			 */
			closeAll: () => {
				const { dialogs } = privateState;
				const ids = Object.keys( dialogs );
				ids.forEach( ( id ) => {
					// Check that state[key] is an object and has an isOpen property.
					if (
						typeof dialogs[ id ] !== 'object' ||
						! dialogs[ id ].hasOwnProperty( 'isOpen' )
					) {
						return;
					}
					privateState.dialogs[ id ].isOpen = false;
				} );
			},
			/**
			 * This function is used by dialog-trigger to open the dialog when clicked.
			 * @param event
			 */
			onClickOpen: withSyncEvent( ( event ) => {
				// We are hijacking all clicks on the trigger and any children to prevent the default click behavior.
				event.preventDefault();
				const { id } = privateState;
				privateActions.open( id );
			} ),
			onTriggerKeydown: withSyncEvent( ( event ) => {
				if ( event.key === 'Enter' || event.key === ' ' ) {
					event.preventDefault();
					const { id } = privateState;
					privateActions.open( id );
				}
			} ),
			/**
			 * This function is used by the close button in the dialog element, when clicked it closes the dialog.
			 * @param event
			 */
			onClickClose: withSyncEvent( ( event ) => {
				event.preventDefault();
				const { id } = privateState;
				privateActions.close( id );
			} ),
			/**
			 * This function allows you to directly open a dialog by passing an id from another store, like so:
			 * store('core/dialog').actions.open('xyz123');
			 * @param {*} passthroughId
			 */
			open: ( passthroughId = false ) => {
				// Most interactions will pass an id through, but if not then fallback to state for id.
				let id = passthroughId;
				if ( ! id ) {
					id = privateState.id;
				}
				// Finally, if there is no id then we can't proceed and should exit early.
				if ( ! id ) {
					return;
				}
				privateState.dialogs[ id ].isOpen = true;
				privateState.dialogs[ id ].showClosingAnimation = false;
			},
			/**
			 * This function allows you to directly close a dialog by passing an id from another store, like so:
			 * store('core/dialog').actions.close('xyz123');
			 * @param {*} passthroughId
			 */
			close: ( passthroughId = false ) => {
				let id = passthroughId;
				if ( ! id ) {
					id = privateState.id;
				}
				if ( ! id ) {
					return;
				}
				privateState.dialogs[ id ].isOpen = false;
			},
		},
		callbacks: {
			onInit: () => {
				// Check if the url has a #<id> hash, check if the hash exists in state.dialogs, if it does, open the dialog.
				const hash = window.location.hash;
				if ( hash ) {
					const hashId = hash.replace( '#', '' );
					if ( privateState.dialogs[ hashId ] ) {
						privateActions.open( hashId );
					}
				}
			},
			/**
			 * Handles the escape key event to close the dialog if it's open.
			 *
			 * @param event The keyboard event.
			 */
			onESCKey: withSyncEvent( ( event ) => {
				const { id, dialog } = privateState;
				if ( id && event.key === 'Escape' ) {
					if ( true === dialog.isOpen ) {
						event.preventDefault();
						privateActions.close( id );
					}
				}
			} ),
			/**
			 * Handles the dialog open event, this is triggered by the user clicking the open button or via an auto activation timer.
			 */
			onOpen: () => {
				const { dialogElement, dialog, id } = privateState;
				// Sanity check, if we don't have an id or dialogElement then we can't proceed.
				if ( ! id || ! dialogElement ) {
					return;
				}
				// If the dialog is meant to not be open, don't proceed.
				if ( ! dialog.isOpen ) {
					return;
				}
				addDialogIdToUrl( id );
				dialogElement?.showModal();
			},
			/**
			 * Handles the dialog close event, this is triggered by the user clicking the close button, pressing the escape key or clicking outside the dialog when it's a non-modal dialog.
			 */
			onClose: () => {
				const { dialogElement, dialog, id } = privateState;
				// Sanity check, if we don't have an id or dialogElement then we can't proceed.
				if ( ! id || ! dialogElement ) {
					return;
				}
				// If the dialog is meant to be open, don't proceed.
				if ( dialog.isOpen ) {
					return;
				}
				// If already closing, don't start another close animation
				if ( dialog.showClosingAnimation ) {
					return;
				}
				// Only proceed if the dialog element is actually open in the DOM
				// This prevents the watcher from triggering close animations when the dialog
				// was never opened in the first place (e.g., on page load when isOpen initializes to false)
				if ( ! dialogElement.open ) {
					return;
				}

				// Check if user prefers reduced motion - if so, close immediately without animation
				const prefersReducedMotion = window.matchMedia(
					'(prefers-reduced-motion: reduce)'
				).matches;

				if ( prefersReducedMotion ) {
					// Close immediately without animation
					dialogElement.close();
					removeDialogIdFromUrl( id );
					document
						.querySelector( '[aria-controls="' + id + '"]' )
						?.focus();
					return;
				}

				// Start closing animation...
				privateState.dialogs[ id ].showClosingAnimation = true;

				// Wait for the CSS animation to complete before closing the dialog element.
				// Using animationend event ensures we close at the exact moment the animation
				// finishes, avoiding timing mismatches between JS and CSS.
				const onAnimationEnd = withScope( ( event ) => {
					// Only handle our closing animation, not other animations
					if ( event.animationName !== 'turn-off-visibility' ) {
						return;
					}
					dialogElement.removeEventListener(
						'animationend',
						onAnimationEnd
					);
					dialogElement.close();
					removeDialogIdFromUrl( id );
					privateState.dialogs[ id ].showClosingAnimation = false;
					document
						.querySelector( '[aria-controls="' + id + '"]' )
						?.focus();
				} );

				dialogElement.addEventListener(
					'animationend',
					onAnimationEnd
				);
			},
			/**
			 * Closes the dialog if the backdrop is clicked.
			 *
			 * @param event
			 */
			onBackdropClick: withSyncEvent( ( event ) => {
				const { ref } = getElement();
				const boundingRects = ref.getBoundingClientRect();
				// make sure the event x and y are within the dialog element, if they are continue...
				if (
					event.clientX >= boundingRects.left &&
					event.clientX <= boundingRects.right &&
					event.clientY >= boundingRects.top &&
					event.clientY <= boundingRects.bottom
				) {
					return;
				}
				const { dialog, id } = privateState;
				if ( true !== dialog.isOpen || dialog.showClosingAnimation ) {
					return;
				}
				privateActions.close( id );
			} ),
		},
	},
	{
		lock: true,
	}
);

// Public store - exposes only the necessary state and actions for third parties
store( 'core/dialog', {
	state: {
		// Read-only access to dialogs via proxy
		get dialogs() {
			return createReadOnlyProxy( privateState.dialogs );
		},
		// Read-only access to current dialog
		get dialog() {
			return createReadOnlyProxy( privateState.dialog );
		},
		// Read-only access to current id
		get id() {
			return privateState.id;
		},
	},
	actions: {
		/**
		 * Opens a dialog by id. This is the public API for opening dialogs.
		 * @param {string} id - The dialog id to open
		 */
		open( id ) {
			privateActions.open( id );
		},
		/**
		 * Closes a dialog by id. This is the public API for closing dialogs.
		 * @param {string} id - The dialog id to close
		 */
		close( id ) {
			privateActions.close( id );
		},
		/**
		 * Closes all open dialogs. This is the public API for closing all dialogs.
		 */
		closeAll() {
			privateActions.closeAll();
		},
	},
} );
