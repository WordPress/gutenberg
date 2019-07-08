/**
 * External dependencies
 */
import { get, set } from 'lodash';

/**
 * WordPress dependencies
 */
import { select } from '@wordpress/data-controls';

/**
 * Internal dependencies
 */
import { editPost } from '../actions';
import { EDIT_MERGE_PROPERTIES } from '../constants';

export function* getDependencies() {
	return {
		post: yield select( 'core/editor', 'getCurrentPost' ),
		content: yield select( 'core/editor', 'getEditedPostContent' ),
		edits: yield select( 'core/editor', 'getPostEdits' ),
	};
}

export function apply( { attribute }, { post, content, edits } ) {
	if ( 'content' === attribute ) {
		return content;
	}

	if ( undefined === get( edits, attribute ) ) {
		return get( post, attribute );
	}

	if ( EDIT_MERGE_PROPERTIES.has( attribute ) ) {
		return {
			...get( post, attribute ),
			...get( edits, attribute ),
		};
	}

	return get( edits, attribute );
}

export function* update( { attribute }, value ) {
	yield editPost( set( {}, attribute, value ) );
}
