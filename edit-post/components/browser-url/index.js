/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { withSelect } from '@wordpress/data';
import { addQueryArgs } from '@wordpress/url';

/**
 * Returns the Post's Edit URL.
 *
 * @param {number} postId Post ID.
 *
 * @return {string} Post edit URL.
 */
export function getPostEditURL( postId ) {
	return addQueryArgs( 'post.php', { post: postId, action: 'edit' } );
}

/**
 * Returns the Post's Trashedd URL.
 *
 * @param {number} postId    Post ID.
 * @param {string} postType Post Type.
 *
 * @return {string} Post trashed URL.
 */
export function getPostTrashedURL( postId, postType ) {
	return addQueryArgs( 'edit.php', {
		trashed: 1,
		post_type: postType,
		ids: postId,
	} );
}

export class BrowserURL extends Component {
	constructor() {
		super( ...arguments );

		this.state = {
			historyId: null,
		};
	}

	componentDidUpdate( prevProps ) {
		const { postId, postStatus, postType } = this.props;
		const { historyId } = this.state;

		if ( postStatus === 'trashed' ) {
			window.location.href = getPostTrashedURL( postId, postType );
		}

		if ( postId === prevProps.postId && postId === historyId ) {
			return;
		}

		if ( postStatus !== 'auto-draft' ) {
			this.setBrowserURL( postId );
		}
	}

	/**
	 * Replaces the browser URL with a post editor link for the given post ID.
	 *
	 * Note it is important that, since this function may be called when the
	 * editor first loads, the result generated `getPostEditURL` matches that
	 * produced by the server. Otherwise, the URL will change unexpectedly.
	 *
	 * @param {number} postId Post ID for which to generate post editor URL.
	 */
	setBrowserURL( postId ) {
		window.history.replaceState(
			{ id: postId },
			'Post ' + postId,
			getPostEditURL( postId )
		);

		this.setState( () => ( {
			historyId: postId,
		} ) );
	}

	render() {
		return null;
	}
}

export default withSelect( ( select ) => {
	const { getCurrentPost } = select( 'core/editor' );
	const { id, status, type } = getCurrentPost();

	return {
		postId: id,
		postStatus: status,
		postType: type,
	};
} )( BrowserURL );
