/**
 * WordPress dependencies
 */
import type { Y } from '@wordpress/sync';

/**
 * Internal dependencies
 */
import type { SelectionState } from '../types';
import type { User } from '../entity-types';

export type CollaboratorInfo = Pick<
	User< 'view' >,
	'id' | 'name' | 'slug' | 'avatar_urls'
> & {
	browserType: string;
	color: string;
	enteredAt: number;
};

/**
 * This base state represents the presence of the collaborator. We expect it to be
 * extended to include additional state describing the collaborator's current activity.
 * This state must be serializable and compact.
 */
export interface BaseState {
	collaboratorInfo: CollaboratorInfo;
}

/**
 * The editor state includes information about the collaborator's current selection.
 */
export interface EditorState {
	selection: SelectionState;
}

/**
 * The post editor state extends the base state with information used to render
 * presence indicators in the post editor.
 */
export interface PostEditorState extends BaseState {
	editorState?: EditorState;
}

/**
 * An enhanced state includes additional metadata about the collaborator's connection.
 */
export type EnhancedState< State > = State & {
	clientId: number;
	isConnected: boolean;
	isMe: boolean;
};

/**
 * An enhanced post editor awareness state includes additional metadata about
 * the collaborator and their connection.
 */
export type PostEditorAwarenessState = EnhancedState< PostEditorState >;

// WordPress collaborator info for debug export (subset of CollaboratorInfo)
export type DebugCollaboratorData = Pick< CollaboratorInfo, 'name' > & {
	wpUserId: CollaboratorInfo[ 'id' ];
};

export interface YDocDebugData {
	doc: Record< string, unknown >;
	clients: Record< number, Array< SerializableYItem > >;
	collaboratorMap: Record< string, DebugCollaboratorData >;
}

// Type for serializable left/right item references to avoid deep nesting
export type SerializableYItemRef = Pick<
	Y.Item,
	'id' | 'length' | 'origin' | 'content'
>;

// Serializable Y.Item - only includes data properties with shallow left/right references
export type SerializableYItem = Pick<
	Y.Item,
	| 'id'
	| 'length'
	| 'origin'
	| 'rightOrigin'
	| 'parent'
	| 'parentSub'
	| 'redone'
	| 'content'
	| 'info'
> & {
	left: SerializableYItemRef | null;
	right: SerializableYItemRef | null;
};

export type EqualityFieldCheck< State, FieldName extends keyof State > = (
	value1?: State[ FieldName ],
	value2?: State[ FieldName ]
) => boolean;
