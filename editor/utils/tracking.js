/* eslint-disable no-console */

export function bumpStat( group, name ) {
	if ( typeof group !== 'string' || typeof name !== 'string' ) {
		console.error(
			'Stat group names and stat names must be strings.'
		);
		return;
	}

	if ( /[^a-z0-9_]/.test( group ) ) {
		console.error(
			'Stat group names must consist of letters, numbers, and underscores.'
		);
		return;
	}

	if ( group.length > 22 ) { // 32 - 'gutenberg_'.length
		console.error(
			'Stat group names cannot be longer than 22 characters.'
		);
		return;
	}

	if ( /[^a-z0-9_-]/.test( name ) ) {
		console.error(
			'Stat names must consist of letters, numbers, underscores, and dashes.'
		);
		return;
	}

	if ( name.length > 32 ) {
		console.error(
			'Stat names cannot be longer than 32 characters.'
		);
		return;
	}

	if ( window.getUserSetting( 'gutenberg_tracking' ) !== 'on' ) {
		return;
	}

	const src = document.location.protocol
		+ '//pixel.wp.com/g.gif?v=wpcom-no-pv'
		+ '&x_gutenberg_' + encodeURIComponent( group )
		+ '=' + encodeURIComponent( name )
		+ '&t=' + Math.random();

	if ( process.env.NODE_ENV === 'development' ) {
		console.log(
			'Skipping stats collection for development build:',
			src
		);
	}

	if ( process.env.NODE_ENV !== 'production' ) {
		return src;
	}

	new window.Image().src = src;
}
