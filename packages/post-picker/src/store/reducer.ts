import type { PostPickerRequest, State } from './types';

export const DEFAULT_STATE: State = {
	request: null,
};

type Action =
	| { type: 'OPEN_POST_PICKER'; request: PostPickerRequest }
	| { type: 'CLOSE_POST_PICKER' };

export default function reducer(
	state: State = DEFAULT_STATE,
	action: Action | { type: string }
): State {
	switch ( action.type ) {
		case 'OPEN_POST_PICKER':
			return {
				request: (
					action as Extract< Action, { type: 'OPEN_POST_PICKER' } >
				 ).request,
			};
		case 'CLOSE_POST_PICKER':
			return DEFAULT_STATE;
	}
	return state;
}
