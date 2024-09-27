/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { withSelect } from '@wordpress/data';
import { addQueryArgs } from '@wordpress/url';
import { store as editorStore } from '@wordpress/editor';

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

export class BrowserURL extends Component {
	constructor() {
		super( ...arguments );

		this.state = {
			historyId: null,
		};
	}

	componentDidUpdate( prevProps ) {
		const { postId, postStatus, hasHistory } = this.props;
		const { historyId } = this.state;

		if (
			( postId !== prevProps.postId || postId !== historyId ) &&
			postStatus !== 'auto-draft' &&
			postId &&
			! hasHistory
		) {
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
	const { getCurrentPost } = select( editorStore );
	const post = getCurrentPost();
	let { id, status, type } = post;
	const isTemplate = [ 'wp_template', 'wp_template_part' ].includes( type );
	if ( isTemplate ) {
		id = post.wp_id;
	}

	return {
		postId: id,
		postStatus: status,
	};
} )( BrowserURL );
