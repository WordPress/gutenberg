/**
 * Internal dependencies
 */
import type { MediaEditorModalUpdate } from './actions';

type OnUpdateCallback = ( updated: MediaEditorModalUpdate ) => void;
type OnCloseCallback = () => void;

export interface State {
	isOpen: boolean;
	id: number | null;
	onUpdate: OnUpdateCallback | null;
	onClose: OnCloseCallback | null;
}

export const DEFAULT_STATE: State = {
	isOpen: false,
	id: null,
	onUpdate: null,
	onClose: null,
};

type Action =
	| {
			type: 'OPEN_MEDIA_EDITOR_MODAL';
			id: number;
			onUpdate: OnUpdateCallback | null;
			onClose: OnCloseCallback | null;
	  }
	| { type: 'CLOSE_MEDIA_EDITOR_MODAL' };

export default function reducer(
	state: State = DEFAULT_STATE,
	action: Action | { type: string }
): State {
	switch ( action.type ) {
		case 'OPEN_MEDIA_EDITOR_MODAL': {
			const { id, onUpdate, onClose } = action as Extract<
				Action,
				{ type: 'OPEN_MEDIA_EDITOR_MODAL' }
			>;
			return {
				isOpen: true,
				id,
				onUpdate,
				onClose,
			};
		}
		case 'CLOSE_MEDIA_EDITOR_MODAL':
			return DEFAULT_STATE;
	}
	return state;
}
