import type { PostEditorState } from './awareness-types';
import { AwarenessState } from './awareness-state';

export class PostEditorAwarenessState extends AwarenessState< PostEditorState > {
	protected equalityFieldChecks = {};

	public setUp(): void {
		// ToDo: Implement user and selection state subscriptions.
	}
}
