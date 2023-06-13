async function markAsRequiringTinymce() {
	const currentUrl = new URL( window.location.href );
	currentUrl.searchParams.set( 'requiresTinymce', '1' );
	window.location.href = currentUrl;
}

window.tinymce = new Proxy(
	{},
	{
		get: markAsRequiringTinymce,
		set: markAsRequiringTinymce,
		apply: markAsRequiringTinymce,
	}
);
