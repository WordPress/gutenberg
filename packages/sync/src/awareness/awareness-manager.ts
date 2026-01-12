/**
 * External dependencies
 */
import type * as Y from 'yjs';

/**
 * Internal dependencies
 */
import type { ObjectID, ObjectType } from '../types';
import type { AwarenessState } from './awareness-state';
import { PostEditorAwarenessState } from './post-editor-awareness-state';

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
 * @param objectType Object type.
 * @param objectId   Object ID.
 * @param ydoc       Yjs document.
 * @return Awareness instance.
 */
export async function createAwareness(
	objectType: ObjectType,
	objectId: ObjectID | null,
	ydoc: Y.Doc
): Promise< AwarenessState | undefined > {
	if ( objectId && objectType.startsWith( 'postType/' ) ) {
		const awareness = new PostEditorAwarenessState( ydoc );
		awareness.setUp();
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
