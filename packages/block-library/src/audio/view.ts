import { getElement, store } from '@wordpress/interactivity';

store(
	'core/audio',
	{
		actions: {
			pauseOtherAudio() {
				// Every Audio block is queried, rather than only the last one
				// played, so an audio that autoplayed before the store was
				// hydrated is paused too.
				const { ref } = getElement();
				document
					.querySelectorAll< HTMLAudioElement >(
						'.wp-block-audio audio'
					)
					.forEach( ( audio ) => {
						if ( audio !== ref ) {
							audio.pause();
						}
					} );
			},
		},
	},
	{ lock: true }
);
