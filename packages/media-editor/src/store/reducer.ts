export interface State {
	isOpen: boolean;
	attachmentId: number | null;
	invocationId: number | null;
}

export const DEFAULT_STATE: State = {
	isOpen: false,
	attachmentId: null,
	invocationId: null,
};

type Action =
	| {
			type: 'OPEN_MEDIA_EDITOR_MODAL';
			attachmentId: number;
			invocationId: number;
	  }
	| { type: 'CLOSE_MEDIA_EDITOR_MODAL' };

export default function reducer(
	state: State = DEFAULT_STATE,
	action: Action | { type: string }
): State {
	switch ( action.type ) {
		case 'OPEN_MEDIA_EDITOR_MODAL': {
			const { attachmentId, invocationId } = action as Extract<
				Action,
				{ type: 'OPEN_MEDIA_EDITOR_MODAL' }
			>;
			return {
				isOpen: true,
				attachmentId,
				invocationId,
			};
		}
		case 'CLOSE_MEDIA_EDITOR_MODAL':
			return DEFAULT_STATE;
	}
	return state;
}
