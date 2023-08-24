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
	selectors: {
		core: {
			comments: {
				showError: ( { state } ) =>
					state.core.comments.error ? 'flex' : 'none',
				submitText: ( { context, state } ) =>
					context.core.comments.isSubmitting
						? state.core.comments.loadingText
						: state.core.comments.submitText,
			},
		},
	},
	actions: {
		core: {
			comments: {
				submit: async ( { event, context, state, ref } ) => {
					let response;
					const existingComments = new Set();
					const comments = ref.closest( '.wp-block-comments' );
					comments
						.querySelectorAll( 'li[id^="comment-"]' )
						.forEach( ( comment ) =>
							existingComments.add( comment.id )
						);

					try {
						event.preventDefault();

						state.core.comments.error = '';
						context.core.comments.isSubmitting = true;

						response = await window.fetch( ref.action, {
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
						const html = await response.text();
						const dom = new window.DOMParser().parseFromString(
							html,
							'text/html'
						);

						if (
							response.status !== 200 ||
							dom.body.id === 'error-page'
						) {
							state.core.comments.error =
								dom.querySelector(
									'.wp-die-message'
								).innerText;
						} else {
							await navigate( response.url, {
								html,
								replace: true,
								force: true,
							} );

							let newComment;
							comments
								.querySelectorAll( 'li[id^="comment-"]' )
								.forEach( ( comment ) => {
									if ( ! existingComments.has( comment.id ) )
										newComment = comment;
								} );

							// Scroll the new comment into view.
							newComment.querySelector( 'a[href]' ).focus();

							// Announce that the comment has been submitted. If the notice is
							// the same, we use a no-break space similar to the trick used by
							// the @wordpress/a11y package: https://github.com/WordPress/gutenberg/blob/c395242b8e6ee20f8b06c199e4fc2920d7018af1/packages/a11y/src/filter-message.js#L20-L26
							context.core.comments.notice =
								state.core.comments.submittedNotice +
								( context.core.comments.notice ===
								state.core.comments.submittedNotice
									? '\u00A0'
									: '' );

							// Add hash to the URL.
							window.history.replaceState(
								{},
								'',
								window.location.pathname +
									window.location.search +
									`#${ newComment.id }`
							);

							ref.reset();
						}

						context.core.comments.isSubmitting = false;
					} catch ( e ) {
						// If something happens at this point, the form has been submitted
						// but we were not able to show it in the screen, so we can just
						// refresh the page.
						window.location.assign(
							response.url || window.location
						);
					}
				},
				changeReplyTo: ( { context, ref, event } ) => {
					event.preventDefault();

					const commentId = ref.dataset.commentid;
					context.core.comments.replyTo = `comment-${ commentId }`;

					// eslint-disable-next-line no-console
					console.log( commentId );
				},
				updateText: ( { context, event } ) => {
					context.core.comments.text = event.target.value;
				},
			},
		},
	},
	effects: {
		core: {
			comments: {
				scrollToError: ( st ) => {
					// Scroll to the error when it's shown.
					if ( st.state.core.comments.error ) {
						st.ref.scrollIntoView( {
							block: 'end',
						} );
					}
				},
			},
		},
	},
} );
