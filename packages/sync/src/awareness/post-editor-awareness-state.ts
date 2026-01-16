/**
 * External dependencies
 */
import * as Y from 'yjs';
/**
 * Internal dependencies
 */
import type { PostEditorState, UserInfo } from './awareness-types';
import { AwarenessState } from './awareness-state';
import { areUserInfosEqual } from '../user-utils';
import { CRDT_RECORD_MAP_KEY } from '../config';

export class PostEditorAwarenessState extends AwarenessState< PostEditorState > {
	protected equalityFieldChecks = {
		userInfo: areUserInfosEqual,
	};

	public setUp( userInfo: UserInfo ): void {
		super.setUp( userInfo );

		this.subscribeToCRDTChanges();
	}

	private subscribeToCRDTChanges(): void {
		const recordMap = this.doc.getMap( CRDT_RECORD_MAP_KEY );

		recordMap.observeDeep( ( changes ) => {
			console.log( changes );
		} );
	}

	// TODO: Add in subscription for user selection changes.
}
