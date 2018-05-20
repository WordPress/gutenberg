/**
* An author autocompleter.
*
* @type {Completer}
*/
export default {
	name: 'users',
	className: 'blocks-autocompleters__user',
	triggerPrefix: '',
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
			<span key="name" className="blocks-autocompleters__user-name">{ user.name }</span>,
			<span key="slug" className="blocks-autocompleters__user-slug">{ user.slug }</span>,
		];
	},
	allowNode() {
		return true;
	},
	onFocus() {
		console.log( 'onFocus' );
	},
	onBlur() {
		console.log( 'onBlur' );
	},
	getOptionCompletion( user ) {
		// After selection.
		console.log( user );
		return `${ user.name }`;
	},
};
