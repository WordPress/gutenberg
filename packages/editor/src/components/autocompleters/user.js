/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';

/**
* A user mentions completer.
*
* @type {Completer}
*/
export default {
	name: 'users',
	className: 'editor-autocompleters__user',
	triggerPrefix: '@',
	options( search ) {
		let payload = '';
		if ( search ) {
			payload = '?search=' + encodeURIComponent( search );
		}
		return apiFetch( { path: '/wp/v2/users' + payload } );
	},
	isDebounced: true,
	getOptionKeywords( user ) {
		return [ user.slug, user.name ];
	},
	getOptionLabel( user ) {
		return [
			<img key="avatar" className="editor-autocompleters__user-avatar" alt="" src={ user.avatar_urls[ 24 ] } />,
			<span key="name" className="editor-autocompleters__user-name">{ user.name }</span>,
			<span key="slug" className="editor-autocompleters__user-slug">{ user.slug }</span>,
		];
	},
	getOptionCompletion( user ) {
		return `@${ user.slug }`;
	},
};
