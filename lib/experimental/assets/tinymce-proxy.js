/* eslint-disable no-undef */
async function reloadWithTinymce() {
	const noticeText = wp.i18n.__(
		'TinyMCE is currently disabled, but a feature you are trying to use needs it.'
	);
	const reloadText = wp.i18n.__( 'Reload the page with TinyMCE enabled.' );
	const noticeId = 'tinymce-proxy-reload-required';
	const redirectUrl = new URL( window.location.href );
	redirectUrl.searchParams.set( 'requiresTinymce', '1' );

	// Warn the user that they need to reload the page with TinyMCE enabled.
	wp.data.dispatch( wp.notices.store ).createWarningNotice( noticeText, {
		id: noticeId,
		actions: [
			{
				url: redirectUrl.toString(),
				label: reloadText,
			},
		],
	} );

	// If notice failed to be displayed for some reason, reload the page with TinyMCE enabled.
	setTimeout( () => {
		const notices = wp.data.select( wp.notices.store ).getNotices();
		if ( ! notices.some( ( notice ) => notice.id === noticeId ) ) {
			window.location.href = redirectUrl.toString();
		}
	}, 200 );
}

window.tinymce = new Proxy(
	{},
	{
		get: reloadWithTinymce,
		set: reloadWithTinymce,
		apply: reloadWithTinymce,
	}
);
/* eslint-enable no-undef */
