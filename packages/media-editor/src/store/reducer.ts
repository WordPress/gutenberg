/**
 * Internal dependencies
 */
import type { MediaEditorModalUpdate } from './actions';

type OnUpdateCallback = ( updated: MediaEditorModalUpdate ) => void;

export interface State {
	isOpen: boolean;
	id: number | null;
	onUpdate: OnUpdateCallback | null;
}

export const DEFAULT_STATE: State = {
	isOpen: false,
	id: null,
	onUpdate: null,
};

type Action =
	| {
			type: 'OPEN_MEDIA_EDITOR_MODAL';
			id: number;
			onUpdate: OnUpdateCallback | null;
	  }
	| { type: 'CLOSE_MEDIA_EDITOR_MODAL' };

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
				isOpen: true,
				id,
				onUpdate,
			};
		}
		case 'CLOSE_MEDIA_EDITOR_MODAL':
			return DEFAULT_STATE;
	}
	return state;
}
