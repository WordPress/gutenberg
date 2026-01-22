/**
 * Internal dependencies
 */
import type { SelectionState } from '../utils/crdt-user-selections';
import type { User } from '../entity-types';

export type UserInfo = Pick<
	User< 'view' >,
	'id' | 'name' | 'slug' | 'avatar_urls'
> & {
	browserType: string;
	color: string;
	enteredAt: number;
};

/**
 * This base state represents the presence of the user. We expect it to be
 * extended to include additional state describing the user's current activity.
 * This state must be serializable and compact.
 */
export interface BaseState {
	userInfo: UserInfo;
}

/**
 * The editor state includes information about the user's current selection.
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
