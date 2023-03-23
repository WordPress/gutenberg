addEventListener( 'DOMContentLoaded', () => {
	const { store, navigate } = window.__experimentalInteractivity;

	store( {
		actions: {
			core: {
				commentsFormSubmission: async ( { event } ) => {
					event.preventDefault();

					const formData = new FormData( event.target );

					const res = await fetch(
						'http://localhost:8888/wp-comments-post.php',
						{
							method: 'POST',
							body: formData,
						}
					);

					const html = await res.text();

					// We need to do something like this.
					// navigate( res.url, {
					// 	force: true,
					// 	replace: true,
					// 	htmlString: html,
					// } );

					event.target.reset();

					debugger;
				},
			},
		},
	} );
} );
