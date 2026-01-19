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

const awarenessInstances: Map< string, AwarenessState > = new Map();

function getAwarenessId(
	objectType: ObjectType,
	objectId: ObjectID | null
): string {
	return `${ objectType }:${ objectId }`;
}

function getAwarenessInstance(
	objectType: ObjectType,
	objectId: ObjectID | null
): AwarenessState | undefined {
	return awarenessInstances.get( getAwarenessId( objectType, objectId ) );
}

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
 * Get the post editor awareness instance for the given post ID and post type.
 * @param postId   Post ID.
 * @param postType Post type.
 * @return Post editor awareness instance.
 */
export function getPostEditorAwareness(
	postId: number,
	postType: string
): PostEditorAwarenessState | undefined {
	const objectId: ObjectID = postId.toString();
	const objectType: ObjectType = `postType/${ postType }`;

	const awareness = getAwarenessInstance( objectType, objectId );
	if ( awareness instanceof PostEditorAwarenessState ) {
		return awareness;
	}

	return undefined;
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

		// TODO: Is there still a need to memoize the current user?
		const currentUser = await recordHandlers.getCurrentUser();
		const userInfo = getUserInfo( awareness, currentUser );

		awareness.setUp( recordHandlers, userInfo );
		awarenessInstances.set(
			getAwarenessId( objectType, objectId ),
			awareness
		);

		return awareness;
	}
	return undefined;
}

/**
 * Set the current user's connection status in the awareness instance for the given object type and object ID.
 *
 * TODO: Use this in a generic way with each provider so it doesn't need to be exported externally.
 *
 * @param objectType  Object type.
 * @param objectId    Object ID.
 * @param isConnected Connection status.
 */
export function setConnectionStatus(
	objectType: ObjectType,
	objectId: ObjectID | null,
	isConnected: boolean
): void {
	getAwarenessInstance( objectType, objectId )?.setConnectionStatus(
		isConnected
	);
}
