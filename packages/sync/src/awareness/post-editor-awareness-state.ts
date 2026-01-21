/**
 * Internal dependencies
 */
import type { PostEditorState, UserInfo } from './awareness-types';
import type { RecordHandlers } from '../types';
import { AwarenessState } from './awareness-state';
import { areUserInfosEqual } from '../user-utils';
import { AWARENESS_CURSOR_UPDATE_THROTTLE_IN_MS } from '../config';
import { areEditorStatesEqual } from '../selection-utils';

export class PostEditorAwarenessState extends AwarenessState< PostEditorState > {
	protected equalityFieldChecks = {
		editorState: areEditorStatesEqual,
		userInfo: areUserInfosEqual,
	};

	public setUp( recordHandlers: RecordHandlers, userInfo: UserInfo ): void {
		super.setUp( recordHandlers, userInfo );

		// Subscribe to user selection changes.
		recordHandlers.subscribeToUserSelectionChanges(
			this.doc,
			( selectionState ) =>
				this.setThrottledLocalStateField(
					'editorState',
					{ selection: selectionState },
					AWARENESS_CURSOR_UPDATE_THROTTLE_IN_MS
				)
		);
	}
}
