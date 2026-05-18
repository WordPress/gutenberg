/**
 * Internal dependencies
 */
import type {
	MediaEditorModalUpdate,
	MediaBrowserConfig,
	MediaBrowserCallbacks,
} from './actions';

type OnUpdateCallback = ( updated: MediaEditorModalUpdate ) => void;

export type Mode = 'edit' | 'browse';

export interface BrowseState {
	config: MediaBrowserConfig;
	callbacks: MediaBrowserCallbacks;
	value: number | number[] | null;
	session: symbol;
}

export interface State {
	isOpen: boolean;
	mode: Mode;
	// Edit-mode state (existing):
	id: number | null;
	onUpdate: OnUpdateCallback | null;
	// Browse-mode state (new):
	browse: BrowseState | null;
	// Set when edit mode was entered from browse, so closing edit returns
	// to the browser rather than dismissing the modal entirely.
	returnToBrowse: boolean;
}

export const DEFAULT_STATE: State = {
	isOpen: false,
	mode: 'edit',
	id: null,
	onUpdate: null,
	browse: null,
	returnToBrowse: false,
};

type Action =
	| {
			type: 'OPEN_MEDIA_EDITOR_MODAL';
			id: number;
			onUpdate: OnUpdateCallback | null;
	  }
	| { type: 'CLOSE_MEDIA_EDITOR_MODAL' }
	| {
			type: 'OPEN_MEDIA_UPLOAD_MODAL';
			browse: BrowseState;
	  }
	| { type: 'CLOSE_MEDIA_UPLOAD_MODAL'; session: symbol | null }
	| {
			type: 'SELECT_MEDIA_IN_BROWSER';
			value: number | number[] | null;
	  }
	| { type: 'ENTER_EDIT_MODE'; id: number }
	| { type: 'EXIT_EDIT_MODE' };

export default function reducer(
	state: State = DEFAULT_STATE,
	action: Action | { type: string }
): State {
	switch ( action.type ) {
		case 'OPEN_MEDIA_EDITOR_MODAL': {
			const { id, onUpdate } = action as Extract<
				Action,
				{ type: 'OPEN_MEDIA_EDITOR_MODAL' }
			>;
			return {
				...DEFAULT_STATE,
				isOpen: true,
				mode: 'edit',
				id,
				onUpdate,
			};
		}
		case 'CLOSE_MEDIA_EDITOR_MODAL':
			return DEFAULT_STATE;

		case 'OPEN_MEDIA_UPLOAD_MODAL': {
			const { browse } = action as Extract<
				Action,
				{ type: 'OPEN_MEDIA_UPLOAD_MODAL' }
			>;
			return {
				...DEFAULT_STATE,
				isOpen: true,
				mode: 'browse',
				browse,
			};
		}

		case 'CLOSE_MEDIA_UPLOAD_MODAL': {
			const { session } = action as Extract<
				Action,
				{ type: 'CLOSE_MEDIA_UPLOAD_MODAL' }
			>;
			// Session guard: a shim cleanup from a superseded session
			// must not close the active modal.
			if ( state.browse && session && state.browse.session !== session ) {
				return state;
			}
			return DEFAULT_STATE;
		}

		case 'SELECT_MEDIA_IN_BROWSER': {
			if ( ! state.browse ) {
				return state;
			}
			const { value } = action as Extract<
				Action,
				{ type: 'SELECT_MEDIA_IN_BROWSER' }
			>;
			return {
				...state,
				browse: {
					...state.browse,
					value,
				},
			};
		}

		case 'ENTER_EDIT_MODE': {
			// Only valid from browse mode. Keep `browse` so that exitEditMode
			// can restore the picker with its prior selection.
			if ( ! state.browse ) {
				return state;
			}
			const { id } = action as Extract<
				Action,
				{ type: 'ENTER_EDIT_MODE' }
			>;
			return {
				...state,
				mode: 'edit',
				id,
				onUpdate: null,
				returnToBrowse: true,
			};
		}

		case 'EXIT_EDIT_MODE': {
			if ( ! state.returnToBrowse || ! state.browse ) {
				return DEFAULT_STATE;
			}
			return {
				...state,
				mode: 'browse',
				id: null,
				onUpdate: null,
				returnToBrowse: false,
			};
		}
	}
	return state;
}
