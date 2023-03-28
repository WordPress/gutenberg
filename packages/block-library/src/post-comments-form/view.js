/**
 * Internal dependencies
 */
import './runtime/init.js';
import { store, navigate } from './runtime';

store( {
	state: {
		core: {
			commentsFormError: '',
		},
	},
	actions: {
		core: {
			commentsFormSubmission: async ( { event, state } ) => {
				event.preventDefault();

				state.core.commentsFormError = '';

				const formData = new FormData( event.target );

				const res = await fetch(
					'http://localhost:8888/wp-comments-post.php',
					{
						method: 'POST',
						body: formData,
					}
				);

				const html = await res.text();

				if ( res.status !== 200 ) {
					const dom = new window.DOMParser().parseFromString(
						html,
						'text/html'
					);
					state.core.commentsFormError =
						dom.querySelector( 'p' ).innerHTML;
				} else {
					navigate( res.url, {
						html,
						force: true,
					} );

					event.target.reset();
				}
			},
		},
	},
} );
