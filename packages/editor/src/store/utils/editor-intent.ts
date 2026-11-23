import { EDITOR_INTENT_EDIT, EDITOR_INTENT_SUGGEST } from '../constants';

/**
 * The intent the editor is in on the entity it currently edits.
 *
 * The suggest intent holds only on the post it was chosen on. On any other
 * entity the editor is editing, without forgetting the choice, so it is
 * suggesting again when it returns to that post.
 *
 * @param state                  Editor store state.
 * @param state.editorIntent
 * @param state.editorIntentPost
 * @param state.postType
 * @param state.postId
 * @return `suggest` or `edit`.
 */
export function getEffectiveEditorIntent( state: {
	editorIntent?: string;
	editorIntentPost?: {
		postType: string | null;
		postId: string | number | null;
	} | null;
	postType?: string | null;
	postId?: string | number | null;
} ): typeof EDITOR_INTENT_EDIT | typeof EDITOR_INTENT_SUGGEST {
	const chosenOn = state.editorIntentPost;
	return state.editorIntent === EDITOR_INTENT_SUGGEST &&
		!! chosenOn &&
		chosenOn.postType === ( state.postType ?? null ) &&
		chosenOn.postId === ( state.postId ?? null )
		? EDITOR_INTENT_SUGGEST
		: EDITOR_INTENT_EDIT;
}
