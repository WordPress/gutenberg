// eslint-disable-next-line eslint-comments/disable-enable-pair
/* eslint-disable no-undef */
document.querySelectorAll( 'form.wp-block-form' ).forEach( function ( form ) {
	// Bail If the form is not using the mailto: action.
	if ( ! form.action || ! form.action.startsWith( 'mailto:' ) ) {
		return;
	}

	const redirectNotification = ( status ) => {
		const urlParams = new URLSearchParams( window.location.search );
		urlParams.append( 'wp-form-result', status );
		window.location.search = urlParams.toString();
	};

	// Add an event listener for the form submission.
	form.addEventListener( 'submit', async function ( event ) {
		event.preventDefault();
		// Get the form data and merge it with the form action and nonce.
		const formData = Object.fromEntries( new FormData( form ).entries() );
		formData.formAction = form.action;
		formData._ajax_nonce = wpBlockFormSettings.nonce;
		formData.action = wpBlockFormSettings.action;
		formData._wp_http_referer = window.location.href;
		formData.formAction = form.action;

		try {
			const response = await fetch( wpBlockFormSettings.ajaxUrl, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
				},
				body: new URLSearchParams( formData ).toString(),
			} );
			if ( response.ok ) {
				redirectNotification( 'success' );
			} else {
				redirectNotification( 'error' );
			}
		} catch ( error ) {
			redirectNotification( 'error' );
		}
	} );
} );
