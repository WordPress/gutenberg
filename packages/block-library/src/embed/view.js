/**
 * Frontend script for the YouTube timestamp seek feature.
 *
 * When an embed block has `data-enable-youtube-seek`, this module:
 *   1. Appends `enablejsapi=1` to each YouTube iframe's src.
 *   2. Loads the YouTube IFrame Player API.
 *   3. Creates YT.Player instances so seek links work.
 *
 * Usage in post content (survives wp_kses because it uses data attributes):
 *   <a href="#" data-yt-seek="754">12:34</a> — seeks the nearest YouTube embed to 12m 34s.
 */

const blocks = document.querySelectorAll(
	'.wp-block-embed[data-enable-youtube-seek]'
);

if ( blocks.length > 0 ) {
	const playerMap = new Map(); // iframe element -> YT.Player
	const pendingIframes = []; // { iframe, id }
	let counter = 0;

	blocks.forEach( ( block ) => {
		const iframe = block.querySelector( 'iframe' );
		if ( ! iframe?.src.includes( 'youtube.com/embed' ) ) {
			return;
		}

		const id = 'yt-seek-player-' + ++counter;
		iframe.id = id;

		const url = new URL( iframe.src );
		if ( ! url.searchParams.has( 'enablejsapi' ) ) {
			url.searchParams.set( 'enablejsapi', '1' );
			iframe.src = url.toString();
		}

		pendingIframes.push( { iframe, id } );
	} );

	if ( pendingIframes.length > 0 ) {
		// Wire up all [data-yt-seek] links in the document.
		document.querySelectorAll( '[data-yt-seek]' ).forEach( ( el ) => {
			el.addEventListener( 'click', ( e ) => {
				e.preventDefault();
				const seconds = parseInt( el.dataset.ytSeek, 10 );
				if ( isNaN( seconds ) ) {
					return;
				}

				// Prefer the YouTube embed in the same block; fall back to the first.
				const block =
					el.closest( '.wp-block-embed[data-enable-youtube-seek]' ) ||
					document.querySelector(
						'.wp-block-embed[data-enable-youtube-seek]'
					);
				const iframe = block?.querySelector( 'iframe' );
				const player = iframe ? playerMap.get( iframe ) : undefined;
				if ( player ) {
					player.seekTo( seconds, true );
					player.playVideo();
				}
			} );
		} );

		// Chain onto any existing YT API ready callback (e.g. from another plugin).
		const prevReady = window.onYouTubeIframeAPIReady;
		window.onYouTubeIframeAPIReady = () => {
			if ( typeof prevReady === 'function' ) {
				prevReady();
			}
			pendingIframes.forEach( ( { iframe, id } ) => {
				playerMap.set( iframe, new window.YT.Player( id ) );
			} );
		};

		// Load the YouTube IFrame API once, even if several blocks are on the page.
		if (
			! document.querySelector( 'script[src*="youtube.com/iframe_api"]' )
		) {
			const script = document.createElement( 'script' );
			script.src = 'https://www.youtube.com/iframe_api';
			document.head.appendChild( script );
		}
	}
}
