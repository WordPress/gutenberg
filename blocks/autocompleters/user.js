/**
* A user mentions completer.
*
* @type {Completer}
*/
export default {
	name: 'users',
	className: 'blocks-autocompleters__user',
	triggerPrefix: '@',
	options( search ) {
		let payload = '';
		if ( search ) {
			payload = '?search=' + encodeURIComponent( search );
		}
		return wp.apiRequest( { path: '/wp/v2/users' + payload } );
	},
	isDebounced: true,
	getOptionKeywords( user ) {
		return [ user.slug, user.name ];
	},
	getOptionLabel( user ) {
		return [
			<img key="avatar" className="blocks-autocompleters__user-avatar" alt="" src={ user.avatar_urls[ 24 ] } />,
			<span key="name" className="blocks-autocompleters__user-name">{ user.name }</span>,
			<span key="slug" className="blocks-autocompleters__user-slug">{ user.slug }</span>,
		];
	},
	allowNode() {
		return true;
	},
	getOptionCompletion( user ) {
		return `@${ user.slug }`;
	},
};
