export interface State {
	isOpen: boolean;
	id: number | null;
	invocationId: number | null;
}

export const DEFAULT_STATE: State = {
	isOpen: false,
	id: null,
	invocationId: null,
};

type Action =
	| {
			type: 'OPEN_MEDIA_EDITOR_MODAL';
			id: number;
			invocationId: number;
	  }
	| { type: 'CLOSE_MEDIA_EDITOR_MODAL' };

export default function reducer(
	state: State = DEFAULT_STATE,
	action: Action | { type: string }
): State {
	switch ( action.type ) {
		case 'OPEN_MEDIA_EDITOR_MODAL': {
			const { id, invocationId } = action as Extract<
				Action,
				{ type: 'OPEN_MEDIA_EDITOR_MODAL' }
			>;
			return {
				isOpen: true,
				id,
				invocationId,
			};
		}
		case 'CLOSE_MEDIA_EDITOR_MODAL':
			return DEFAULT_STATE;
	}
	return state;
}
