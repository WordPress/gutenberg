/**
 * WordPress dependencies
 */
import { store, navigate } from '@wordpress/interactivity';

store( {
	state: {
		core: {
			comments: {
				error: '',
			},
		},
	},
	actions: {
		core: {
			comments: {
				submit: async ( { event, state } ) => {
					event.preventDefault();

					state.core.comments.error = '';

					const res = await window.fetch( event.target.action, {
						method: 'POST',
						body: new window.FormData( event.target ),
					} );

					const html = await res.text();

					if ( res.status !== 200 ) {
						const dom = new window.DOMParser().parseFromString(
							html,
							'text/html'
						);
						state.core.comments.error =
							dom.querySelector( '.wp-die-message' ).innerText;
					} else {
						navigate( res.url, {
							html,
							replace: true,
							force: true,
						} );

						event.target.reset();
					}
				},
			},
		},
	},
} );
