import type { PostEditorState } from './awareness-types';
import { AwarenessState } from './awareness-state';

export class PostEditorAwarenessState extends AwarenessState< PostEditorState > {
	protected equalityFieldChecks = {};

	// TODO: Add in subscription for user selection changes.
}
