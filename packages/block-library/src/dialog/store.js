// Register a @wordpress/data store for the dialog open/closed state.
// Whenever a core/dialog block is initialized, we should get it's blocks, find the dialog-element block, capture it's client id and then
// use that to manage the open/closed state of the dialog. Really simple like { xyzCleintId: { isOpen: true }, abcdClientId: { isOpen: false } }.
// Then we can use useSelect to get the isOpen state and useDispatch to create open/close actions in the dialog, dialog-element, and dialog-trigger blocks.
/**
 * WordPress dependencies
 */
import { createReduxStore } from '@wordpress/data';

/**
 * Internal dependencies
 */
const DEFAULT_STATE = {
	id: null,
	dialogs: {},
};

const actions = {
	/**
	 * This function is used by dialog-element to initialize the dialog in the store.
	 * @param {*} id The clientId of the dialog-element block.
	 */
	init: ( id ) => {
		return {
			type: 'INIT_DIALOG',
			id,
		};
	},
	/**
	 * This function is used by dialog-element to remove the dialog from the store when the block is removed.
	 * @param {*} id The clientId of the dialog-element block.
	 */
	destroy: ( id ) => {
		return {
			type: 'DESTROY_DIALOG',
			id,
		};
	},
	/**
	 * This function is used to open the dialog when called, from any block.
	 * @param {*} passthroughId The clientId of the dialog-element block to open.
	 */
	open: ( passthroughId = false ) => {
		return {
			type: 'OPEN_DIALOG',
			id: passthroughId,
		};
	},
	/**
	 * This function is used to close the dialog when called, from any block.
	 * @param {*} passthroughId The clientId of the dialog-element block to close.
	 */
	close: ( passthroughId = false ) => {
		return {
			type: 'CLOSE_DIALOG',
			id: passthroughId,
		};
	},
};

const reducer = ( state = DEFAULT_STATE, action ) => {
	switch ( action.type ) {
		case 'INIT_DIALOG': {
			const { id } = action;
			if ( ! id ) {
				return state;
			}
			return {
				...state,
				id,
				dialogs: {
					...state.dialogs,
					[ id ]: {
						isOpen: false,
						closingModal: false,
					},
				},
			};
		}
		case 'DESTROY_DIALOG': {
			const { id } = action;
			if ( ! id ) {
				return state;
			}
			const newDialogs = { ...state.dialogs };
			delete newDialogs[ id ];
			let newId = state.id;
			if ( state.id === id ) {
				newId = Object.keys( newDialogs )[ 0 ] || null;
			}
			return {
				...state,
				id: newId,
				dialogs: newDialogs,
			};
		}
		case 'OPEN_DIALOG': {
			// Most interactions will pass an id through, but if not then fallback to state for id.
			let id = action.id;
			if ( ! id ) {
				id = state.id;
			}
			// Finally, if there is no id then we can't proceed and should exit early.
			if ( ! id ) {
				return state;
			}
			return {
				...state,
				dialogs: {
					...state.dialogs,
					[ id ]: {
						...state.dialogs[ id ],
						isOpen: true,
						closingModal: false,
					},
				},
			};
		}
		case 'CLOSE_DIALOG': {
			let id = action.id;
			if ( ! id ) {
				id = state.id;
			}
			if ( ! id ) {
				return state;
			}
			return {
				...state,
				dialogs: {
					...state.dialogs,
					[ id ]: {
						...state.dialogs[ id ],
						isOpen: false,
						closingModal: true,
					},
				},
			};
		}
		default:
			return state;
	}
};

const selectors = {
	/**
	 * Get the open/closed state of a dialog by its clientId.
	 * @param {*} state The current state of the store.
	 * @param {*} id    The clientId of the dialog-element block.
	 * @return {boolean} isOpen
	 */
	isOpen: ( state, id ) => {
		if ( ! id || ! state.dialogs[ id ] ) {
			return false;
		}
		return state.dialogs[ id ].isOpen;
	},
	/**
	 * Get the closingModal state of a dialog by its clientId.
	 * This is used to determine if we should add the closing animation class.
	 * @param {*} state The current state of the store.
	 * @param {*} id    The clientId of the dialog-element block.
	 * @return {boolean} closingModal
	 */
	isClosingModal: ( state, id ) => {
		if ( ! id || ! state.dialogs[ id ] ) {
			return false;
		}
		return state.dialogs[ id ].closingModal;
	},
};

export const STORE_NAME = 'core/dialog';

export const store = createReduxStore( STORE_NAME, {
	reducer,
	actions,
	selectors,
} );
