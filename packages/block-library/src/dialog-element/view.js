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
	url.searchParams.set( 'dialogId', id );
	// Update the URL without adding to history
	window.history.replaceState( {}, '', url );
}

function removeDialogIdFromUrl() {
	const url = new URL( window.location.href );
	url.searchParams.delete( 'dialogId' );
	// Update the URL without adding to history
	window.history.replaceState( {}, '', url );
}

const { actions, state } = store( 'core/dialog', {
	state: {
		get id() {
			const context = getContext();
			return context?.id;
		},
		get dialog() {
			return state.dialogs[ state.id ];
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
			const { dialogs } = state;
			const ids = Object.keys( dialogs );
			ids.forEach( ( id ) => {
				// Check that state[key] is an object and has an isOpen property.
				if (
					typeof dialogs[ id ] !== 'object' ||
					! dialogs[ id ].hasOwnProperty( 'isOpen' )
				) {
					return;
				}
				state.dialogs[ id ].isOpen = false;
			} );
		},
		/**
		 * This function is used by dialog-trigger to open the dialog when clicked.
		 * @param event
		 */
		onClickOpen: withSyncEvent( ( event ) => {
			// We are hijacking all clicks on the trigger and any children to prevent the default click behavior.
			event.preventDefault();
			const { id } = state;
			actions.open( id );
		} ),
		/**
		 * This function is used by the close button in the dialog element, when clicked it closes the dialog.
		 * @param event
		 */
		onClickClose: withSyncEvent( ( event ) => {
			event.preventDefault();
			const { id } = state;
			actions.close( id );
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
				id = state.id;
			}
			// Finally, if there is no id then we can't proceed and should exit early.
			if ( ! id ) {
				return;
			}
			state.dialogs[ id ].isOpen = true;
			state.dialogs[ id ].closingModal = false;
		},
		/**
		 * This function allows you to directly close a dialog by passing an id from another store, like so:
		 * store('core/dialog').actions.close('xyz123');
		 * @param {*} passthroughId
		 */
		close: ( passthroughId = false ) => {
			let id = passthroughId;
			if ( ! id ) {
				id = state.id;
			}
			if ( ! id ) {
				return;
			}
			state.dialogs[ id ].isOpen = false;
		},
	},
	callbacks: {
		/**
		 * Handles the escape key event to close the dialog if it's open.
		 *
		 * @param event The keyboard event.
		 */
		onESCKey: withSyncEvent( ( event ) => {
			const { id, dialog } = state;
			if ( id && event.key === 'Escape' ) {
				if ( true === dialog.isOpen ) {
					event.preventDefault();
					actions.close( id );
				}
			}
		} ),
		/**
		 * Handles the dialog open event, this is triggered by the user clicking the open button or via an auto activation timer.
		 */
		onOpen: () => {
			const { dialogElement, dialog, id } = state;
			// Sanity check, if we don't have an id or dialogElement then we can't proceed.
			if ( ! id || ! dialogElement ) {
				return;
			}
			// If the dialog is meant to not be open, don't proceed.
			if ( ! dialog.isOpen ) {
				return;
			}
			if ( dialog.enableDeepLink ) {
				addDialogIdToUrl( id );
			}
			dialogElement?.showModal();
		},
		/**
		 * Handles the dialog close event, this is triggered by the user clicking the close button, pressing the escape key or clicking outside the dialog when it's a non-modal dialog.
		 */
		onClose: () => {
			const { dialogElement, dialog, id } = state;
			// Sanity check, if we don't have an id or dialogElement then we can't proceed.
			if ( ! id || ! dialogElement ) {
				return;
			}
			// If the dialog is meant to be open, don't proceed.
			if ( dialog.isOpen ) {
				return;
			}
			// Start isClosing animation...
			state.dialogs[ id ].isClosing = true;
			// Allow for animation to complete...
			setTimeout(
				withScope( () => {
					dialogElement?.close();
					removeDialogIdFromUrl( id ); // We always clean the dialog id regardless of whether deep linking is enabled or not.
					state.dialogs[ id ].isClosing = false;
					state.dialogs[ id ].isOpen = false;
				} ),
				dialog.animationDuration
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
			const { dialog, id } = state;
			if ( true !== dialog.isOpen || dialog.isClosing ) {
				return;
			}
			actions.close( id );
		} ),
		/**
		 * Activates the current dialog element if there is an auto activation timer set.
		 */
		onAutoActivation: () => {
			const { id, dialog, dialogs } = state;
			if (
				! id &&
				! dialog.activationTimerDuration &&
				-1 !== dialog.activationTimerDuration
			) {
				return;
			}
			// Check if any of the dialogs are already open,
			// if so we don't want to close or auto active another dialog.
			const dialogIds = Object.keys( dialogs );
			for ( let i = 0; i < dialogIds.length; i++ ) {
				const dialogId = dialogIds[ i ];
				if ( dialogs[ dialogId ].isOpen ) {
					return;
				}
			}
			if ( 1 <= dialog.activationTimerDuration ) {
				setTimeout(
					withScope( () => {
						actions.closeAll();
						actions.open( id );
					} ),
					dialog.activationTimerDuration
				);
			}
		},
	},
} );
