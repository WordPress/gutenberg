/**
 * External dependencies
 */
import Alpine from 'alpinejs';

window.Alpine = Alpine;

const commentObject = () => ( {
	commentContent: '',
	open: false,
	async postComment( { content, parent } ) {
		const commentPosted = await window.fetch(
			window.apiSettings.root + 'wp/v2/comments/',
			{
				method: 'POST',
				body: JSON.stringify( {
					post: 1,
					author_name: 'admin',
					author_email: 'wordpress@example.com',
					parent,
					content,
				} ),
				headers: {
					'Content-type': 'application/json; charset=UTF-8',
					'X-WP-Nonce': window.apiSettings.nonce,
				},
			}
		);
		const comment = await commentPosted.json();
		if ( comment ) {
			this.open = false;
			this.comments.push( {
				id: comment.id,
				author: comment.author_name,
				date: comment.date,
				content: comment.content?.rendered,
			} );
		}
	},
} );

Alpine.data( 'commentObject', commentObject );

Alpine.start();
