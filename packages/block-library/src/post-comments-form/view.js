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
				submit: async ( { event, state, ref } ) => {
					let res;
					try {
						event.preventDefault();

						state.core.comments.error = '';

						res = await window.fetch( ref.action, {
							method: 'POST',
							body: new window.FormData( ref ),
						} );
					} catch ( e ) {
						// If something fails at this point, the form hasn't been submitted
						// and we can submit it again manually to the server. This is using
						// the prototype because ref.submit() could be overwritten by an
						// `<input name="submit"> element.
						window.HTMLFormElement.prototype.submit.bind( ref )();
					}
					try {
						const html = await res.text();

						if ( res.status !== 200 ) {
							const dom = new window.DOMParser().parseFromString(
								html,
								'text/html'
							);
							state.core.comments.error =
								dom.querySelector(
									'.wp-die-message'
								).innerText;
						} else {
							navigate( res.url, {
								html,
								replace: true,
								force: true,
							} );

							ref.reset();
						}
					} catch ( e ) {
						// If something happens at this point, the form has been submitted
						// but we were not able to show it in the screen, so we can just
						// refresh the page.
						window.location.assign( res.url || window.location );
					}
				},
			},
		},
	},
} );
