/**
 * External dependencies
 */
import optimist from 'redux-optimist';

/**
 * WordPress dependencies
 */
import { combineReducers } from '@wordpress/data';

/**
 * Internal dependencies
 */
import {
	editor,
	initialEdits,
	currentPost,
	preferences,
	saving,
	postLock,
	reusableBlocks,
	template,
	previewLink,
	postSavingLock,
	isReady,
	editorSettings,
} from './reducer.js';

import { EDITOR_SETTINGS_DEFAULTS } from './defaults.js';

EDITOR_SETTINGS_DEFAULTS.autosaveInterval = 2; // This is a way to override default on mobile

export * from './reducer.js';

/**
 * Reducer returning the post title state.
 *
 * @param {PostTitleState} state  Current state.
 * @param {Object}         action Dispatched action.
 *
 * @return {Object} Updated state.
 */
export const postTitle = combineReducers( {
	isSelected( state = false, action ) {
		switch ( action.type ) {
			case 'TOGGLE_POST_TITLE_SELECTION':
				return action.isSelected;
		}

		return state;
	},
} );

export default optimist( combineReducers( {
	editor,
	initialEdits,
	currentPost,
	preferences,
	saving,
	postLock,
	reusableBlocks,
	template,
	previewLink,
	postSavingLock,
	isReady,
	editorSettings,
	postTitle,
} ) );
