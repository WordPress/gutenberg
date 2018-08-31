/**
 * External dependencies
 */
import { merge } from 'lodash';

/**
 * WordPress dependencies
 */
import { parse } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { resetBlocks } from '../actions';
import { getPostEdits, getCurrentPostAttribute } from '../selectors';

/**
 * Returns true if the action includes the `skipContentParse` option indicating
 * that content should be synced to blocks state, regardless of whether the
 * value has changed.
 *
 * @param {Object} action Action object to test.
 *
 * @return {boolean} Whether block parse is to be forced.
 */
export function isForcedParse( action ) {
	return Boolean( action.options ) && action.options.skipContentParse === false;
}

/**
 * Returns true if the action includes the `skipContentParse` option indicating
 * that a parse to sync blocks state should be skipped, even if content has
 * changed. This can be used to optimize frequent updates to content, followed
 * by a subsequent force parse.
 *
 * @param {Object} action Action object to test.
 *
 * @return {boolean} Whether block parse is to be forced.
 */
export function isSkippedParse( action ) {
	return Boolean( action.options && action.options.skipContentParse );
}

/**
 * Returns the current edited post content. Unlike the `getEditedPostContent`
 * selector from the editor store, this intentionally disregards the blocks
 * state, since it's assumed this would be used by the middleware in populating
 * said blocks state.
 *
 * In all other usage of edited post content, the blocks state is considered
 * the canonical source of truth. The middleware is responsible for making this
 * blocks state available. For example, when editing an existing post, blocks
 * state will have a default value of an empty array. In resetting the blocks
 * state, the middleware will consider initial edits, if any exist, but defer
 * to the post's persisted value.
 *
 * @param {Object} state Editor state.
 *
 * @return {string} Edited post content.
 */
export function getPostContent( state ) {
	const edits = getPostEdits( state );
	if ( edits.hasOwnProperty( 'content' ) ) {
		return edits.content;
	}

	return getCurrentPostAttribute( state, 'content' );
}

export default ( store ) => {
	const { getState } = store;
	let previousContent;

	return ( next ) => ( action ) => {
		const result = next( action );

		const content = getPostContent( getState() );

		// Reset blocks if content has changed. This also accounts for the case
		// where there is no edited content (treat as undefined).
		if ( content !== previousContent || isForcedParse( action ) ) {
			previousContent = content;

			// An instruction to skip the content parse implies that content
			// may have in-fact changed, but a re-parse is not necessary. It's
			// important to update previousContent to avoid a future unrelated
			// action without skip flag incurring the re-parse.
			if ( ! isSkippedParse( action ) ) {
				// Avoid parsing blocks if content empty. This is not just an
				// optimization, but avoids passing an invalid undefined
				// argument to the block parser.
				const blocks = content ? parse( content ) : [];

				// Avoid infinite loop and instruct next middleware pass to
				// avoid content parse by merging skip into action options.
				const resetAction = merge(
					resetBlocks( blocks ),
					{ options: { skipContentParse: true } }
				);

				store.dispatch( resetAction );
			}
		}

		return result;
	};
};
