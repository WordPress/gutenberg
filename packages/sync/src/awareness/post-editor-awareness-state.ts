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
import { CRDT_RECORD_METADATA_SAVED_AT_KEY, CRDT_RECORD_METADATA_SAVED_BY_KEY, CRDT_RECORD_METADATA_MAP_KEY } from '../config';

export class PostEditorAwarenessState extends AwarenessState< PostEditorState > {
	protected equalityFieldChecks = {
		userInfo: areUserInfosEqual,
	};

	public setUp( userInfo: UserInfo ): void {
		super.setUp( userInfo );

		this.subscribeToCRDTChanges();
	}

	private subscribeToCRDTChanges(): void {
		const now = Date.now();
		const recordMeta = this.doc.getMap( CRDT_RECORD_METADATA_MAP_KEY );

		recordMeta.observe( ( event: Y.YMapEvent< unknown >, transaction: Y.Transaction ) => {
			if ( transaction.local ) {
				return;
			}

			event.keysChanged.forEach( ( key: string ) => {
				switch ( key ) {
					// A remote user has saved the document.
					case CRDT_RECORD_METADATA_SAVED_AT_KEY: {
						const savedTimestamp = recordMeta.get( CRDT_RECORD_METADATA_SAVED_AT_KEY );
						const remoteClientId = recordMeta.get( CRDT_RECORD_METADATA_SAVED_BY_KEY );

						// Type / "undefined" guard.
						if ( 'number' !== typeof remoteClientId || 'number' !== typeof savedTimestamp ) {
							break;
						}

						const userState = this.getStates().get( remoteClientId );

						if (
							// Ignore if the savedAt timestamp is older than our session
							now > savedTimestamp ||
							// Ignore if we don't have a user state for the client ID
							! userState ||
							// Ignore if this is our own saved event (can happen on refresh or reconnect)
							userState.userInfo.id === this.getLocalStateField( 'userInfo' )?.id
						) {
							break;
						}

						console.log( 'Document was saved by client ID', remoteClientId );
					}
				}
			} );
		} );
	}

	// TODO: Add in subscription for user selection changes.
}
