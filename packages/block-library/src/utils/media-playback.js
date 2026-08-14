const MEDIA_PLAY_EVENT = 'wp-block-library-media-play';
const MEDIA_SELECTOR = 'audio, video';
const COORDINATOR_KEY = '__wpBlockLibraryMediaPlayback';

function getDocument() {
	return typeof document === 'undefined' ? undefined : document;
}

function getCoordinator() {
	const currentWindow = getDocument()?.defaultView;
	if ( ! currentWindow ) {
		return;
	}

	currentWindow[ COORDINATOR_KEY ] ??= {
		isListening: false,
		playlistPlayers: new Set(),
	};

	return currentWindow[ COORDINATOR_KEY ];
}

function pauseNativeMedia( source ) {
	getDocument()
		?.querySelectorAll( MEDIA_SELECTOR )
		.forEach( ( media ) => {
			if ( media !== source && ! media.paused ) {
				media.pause();
			}
		} );
}

function pausePlaylistPlayers( source ) {
	getCoordinator()?.playlistPlayers.forEach( ( player ) => {
		if ( player !== source && player.instance?.isPlaying ) {
			player.instance.pause();
		}
	} );
}

function pauseOtherMedia( source ) {
	pauseNativeMedia( source );
	pausePlaylistPlayers( source );
}

function isMediaElement( element ) {
	return element?.matches?.( MEDIA_SELECTOR );
}

export function notifyMediaPlayback( source ) {
	const currentDocument = getDocument();

	if ( ! currentDocument ) {
		return;
	}

	currentDocument.dispatchEvent(
		new currentDocument.defaultView.CustomEvent( MEDIA_PLAY_EVENT, {
			detail: { source },
		} )
	);
}

export function registerPlaylistPlayer( player ) {
	const playlistPlayers = getCoordinator()?.playlistPlayers;

	playlistPlayers?.add( player );

	return () => {
		playlistPlayers?.delete( player );
	};
}

function setupMediaPlaybackListeners() {
	const currentDocument = getDocument();
	const coordinator = getCoordinator();

	if ( ! currentDocument || ! coordinator || coordinator.isListening ) {
		return;
	}

	currentDocument.addEventListener(
		MEDIA_PLAY_EVENT,
		( event ) => pauseOtherMedia( event.detail?.source ),
		true
	);

	currentDocument.addEventListener(
		'play',
		( event ) => {
			if ( isMediaElement( event.target ) ) {
				notifyMediaPlayback( event.target );
			}
		},
		true
	);

	coordinator.isListening = true;
}

setupMediaPlaybackListeners();
