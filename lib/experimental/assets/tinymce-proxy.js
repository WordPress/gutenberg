/* eslint-disable no-undef */
async function reloadWithTinymce() {
	const { noticeText, reloadText } = window.gutenbergTinymceProxy;
	const redirectUrl = new URL( window.location.href );
	redirectUrl.searchParams.set( 'requiresTinymce', '1' );

	// Warn the user that they need to reload the page with TinyMCE enabled.
	wp.data.dispatch( wp.notices.store ).createWarningNotice( noticeText, {
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
		if (
			notices.length === 0 ||
			notices.some( ( notice ) => notice.content !== noticeText )
		) {
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
