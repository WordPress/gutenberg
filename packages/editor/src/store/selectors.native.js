/**
 * WordPress dependencies
 */
import { createRegistrySelector } from '@wordpress/data';

/**
 * Internal dependencies
 */
import {
	isEditedPostDirty,
	isEditedPostSaveable,
	hasChangedContent,
} from './selectors.js';

export * from './selectors.js';

/**
 * Returns true if post title is selected.
 *
 * @param {Object} state Global application state.
 *
 * @return {boolean} Whether current post title is selected.
 */
export function isPostTitleSelected( state ) {
	return state.postTitle.isSelected;
}

/**
 * Returns true if the post can be autosaved, or false otherwise.
 *
 * @param {Object} state    Global application state.
 * @param {Object} autosave A raw autosave object from the REST API.
 *
 * @return {boolean} Whether the post can be autosaved.
 */
export const isEditedPostAutosaveable = createRegistrySelector( ( ) => function( state ) {
	// A post must contain a title, an excerpt, or non-empty content to be valid for autosaving.
	if ( ! isEditedPostSaveable( state ) ) {
		return false;
	}

	// To avoid an expensive content serialization, use the content dirtiness
	// flag in place of content field comparison against the known autosave.
	// This is not strictly accurate, and relies on a tolerance toward autosave
	// request failures for unnecessary saves.
	if ( hasChangedContent( state ) ) {
		return true;
	}

	if ( isEditedPostDirty( state ) ) {
		return true;
	}

	return false;
} );
