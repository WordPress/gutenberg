/**
 * Internal dependencies
 */
import type { PostEditorState, UserInfo } from './awareness-types';
import { AwarenessState } from './awareness-state';
import { areUserInfosEqual } from '../utils';

export class PostEditorAwarenessState extends AwarenessState< PostEditorState > {
	protected equalityFieldChecks = {
		userInfo: areUserInfosEqual,
	};

	public setUp( userInfo: UserInfo ): void {
		super.setUp( userInfo );
	}

	// TODO: Add in subscription for user selection changes.
}
