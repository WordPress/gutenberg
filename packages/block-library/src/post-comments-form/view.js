/**
 * WordPress dependencies
 */
import {
	getContext,
	getElement,
	store,
	navigate,
} from '@wordpress/interactivity';

const focusableSelectors = [
	'input:not([disabled]):not([type="hidden"]):not([aria-hidden])',
	'select:not([disabled]):not([aria-hidden])',
	'textarea:not([disabled]):not([aria-hidden])',
	'[contenteditable]',
	'[tabindex]:not([tabindex^="-"])',
];

const { state } = store( 'core/comments', {
	state: {
		error: '',
		get showError() {
			return state.error ? 'flex' : 'none';
		},
		get submitButtonText() {
			const { isSubmitting } = getContext();
			const { loadingText, submitText } = state;
			return isSubmitting ? loadingText : submitText;
		},
		get displayCancelReply() {
			const { formSlot } = getContext();
			return formSlot ? undefined : 'none';
		},
	},
	actions: {
		submit: async ( event ) => {
			let response;
			const context = getContext();
			const { ref } = getElement();
			const existingComments = new Set();
			const comments = ref.closest( '.wp-block-comments' );
			comments
				.querySelectorAll( 'li[id^="comment-"]' )
				.forEach( ( comment ) => existingComments.add( comment.id ) );

			try {
				event.preventDefault();

				state.error = '';
				context.isSubmitting = true;

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

				if ( response.status !== 200 || dom.body.id === 'error-page' ) {
					state.error =
						dom.querySelector( '.wp-die-message' ).innerText;
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
					context.notice =
						state.submittedNotice +
						( context.notice === state.submittedNotice
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

					// Reset form fields and position.
					context.formSlot = undefined;
					const { fields } = context;
					for ( const key in fields ) {
						fields[ key ] = key !== 'comment_parent' ? '' : 0;
					}
				}

				context.isSubmitting = false;
			} catch ( e ) {
				// If something happens at this point, the form has been submitted
				// but we were not able to show it in the screen, so we can just
				// refresh the page.
				window.location.assign( response.url || window.location );
			}
		},
		changeReplyTo: ( event ) => {
			event.preventDefault();
			const context = getContext();
			const { ref } = getElement();
			const { commentid, replyto } = ref.dataset;
			context.replyTitle = replyto;
			context.formSlot = `comment-${ commentid }`;
			context.fields.comment_parent = commentid;
		},
		cancelReply: ( event ) => {
			event.preventDefault();
			const context = getContext();
			context.formSlot = undefined;
			context.fields.comment_parent = 0;
		},
		updateField: ( event ) => {
			const { name, value } = event.target;
			const context = getContext();
			context.fields[ name ] = value;
		},
		updateReplyTitle: () => {
			const context = getContext();
			const { ref } = getElement();
			if ( context.fields.comment_parent !== 0 ) {
				ref.firstChild.replaceWith( context.replyTitle );
			}
		},
	},
	callbacks: {
		scrollToError: () => {
			// Scroll to the error when it's shown.
			if ( state.error ) {
				const { ref } = getElement();
				ref.scrollIntoView( {
					behavior: 'smooth',
					block: 'end',
				} );
			}
		},
		scrollOnReply: () => {
			const { formSlot } = getContext();
			const { ref } = getElement();

			// Focus on the first field in the comment form.
			if ( formSlot )
				ref.querySelector( 'form' )
					.querySelector( focusableSelectors )
					.focus();
		},
	},
} );
