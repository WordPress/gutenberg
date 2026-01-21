/**
 * External dependencies
 */
import type * as Y from 'yjs';

/**
 * Internal dependencies
 */
import type { ObjectID, ObjectType, RecordHandlers } from '../types';
import type { AwarenessState } from './awareness-state';
import { PostEditorAwarenessState } from './post-editor-awareness-state';
import type { UserInfo, WordPressUserInfo } from './awareness-types';
import { getBrowserName, getNewUserColor } from '../user-utils';

function getUserInfo(
	awareness: AwarenessState,
	wpUser: WordPressUserInfo
): UserInfo {
	const states = awareness.getStates();
	// TODO: There is a timing issue here. The other users aren't yet synced, and as a result the same color could be assigned to multiple users.
	const otherUserColors = Array.from( states.entries() )
		.filter(
			( [ clientId, state ] ) =>
				state.userInfo && clientId !== awareness.clientID
		)
		.map( ( [ , state ] ) => state.userInfo.color )
		.filter( Boolean );

	return {
		...wpUser,
		browserType: getBrowserName(),
		color: getNewUserColor( otherUserColors ),
		enteredAt: Date.now(),
	};
}

/**
 * Create an awareness instance for the given object type and object ID.
 * @param objectType     Object type.
 * @param objectId       Object ID.
 * @param ydoc           Yjs document.
 * @param recordHandlers Record handlers.
 * @return Awareness instance.
 */
export async function createAwareness(
	objectType: ObjectType,
	objectId: ObjectID | null,
	ydoc: Y.Doc,
	recordHandlers: RecordHandlers
): Promise< AwarenessState | undefined > {
	if ( objectId && objectType.startsWith( 'postType/' ) ) {
		const awareness = new PostEditorAwarenessState( ydoc );

		const currentUser = await recordHandlers.getCurrentUser();
		const userInfo = getUserInfo( awareness, currentUser );

		awareness.setUp( recordHandlers, userInfo );

		return awareness;
	}
	return undefined;
}
