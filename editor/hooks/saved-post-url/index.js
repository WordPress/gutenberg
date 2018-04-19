/**
 * External dependencies.
 */
import { get } from 'lodash';

/**
 * WordPress dependencies.
 */
import { addAction } from '@wordpress/hooks';

/**
 * Internal dependencies.
 */
import { getPostEditUrl } from '../../utils/url';

addAction(
	'editor.postSaveSucceeded',
	'core/editor/set-saved-post-url',
	function( post ) {
		if ( get( window.history.state, 'id' ) !== post.id ) {
			window.history.replaceState(
				{ id: post.id },
				'Post ' + post.id,
				getPostEditUrl( post.id )
			);
		}
	}
);
