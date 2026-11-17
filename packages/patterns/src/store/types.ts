import type { ThunkArgs } from '@wordpress/data';
import type { store } from '.';
import type * as actions from './actions';
import type * as selectors from './selectors';

/**
 * The patterns store state.
 */
export interface State {
	/**
	 * Whether each pattern block, keyed by its client ID, is being edited.
	 */
	isEditingPattern: Record< string, boolean >;
}

export interface SetEditingPatternAction {
	type: 'SET_EDITING_PATTERN';
	clientId: string;
	isEditing: boolean;
}

export type Action = SetEditingPatternAction;

/**
 * A pattern exported to a JSON file.
 */
export interface PatternJSON {
	__file: string;
	title: string;
	content: string;
	syncStatus?: string;
}

/**
 * The overridden attributes of a pattern's blocks, keyed by block name.
 */
export type PatternOverrides = Record< string, Record< string, unknown > >;

/**
 * Thunk arguments for the patterns store, including its private selectors
 * and actions.
 */
export type PatternsThunkArgs = ThunkArgs<
	typeof store,
	typeof selectors,
	typeof actions
>;
