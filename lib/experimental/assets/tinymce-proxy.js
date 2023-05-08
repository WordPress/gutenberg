async function markAsRequiringTinymce() {
	const expiration = new Date( 'Dec 31, 2099 23:59:59' );
	document.cookie = `requiresTinymce=1; expires=${ expiration }; path=/`;
	window.location.reload();
}

window.tinymce = new Proxy(
	{},
	{
		get: markAsRequiringTinymce,
		set: markAsRequiringTinymce,
		apply: markAsRequiringTinymce,
	}
);
