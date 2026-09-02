import { store, getElement } from '@wordpress/interactivity';

const mediaQuery =
	typeof window !== 'undefined' && window.matchMedia
		? window.matchMedia( '(prefers-reduced-motion: reduce)' )
		: null;

const { state } = store(
	'core/video',
	{
		state: {
			prefersReducedMotion: !! mediaQuery?.matches,
		},
		callbacks: {
			honorReducedMotion() {
				if ( ! state.prefersReducedMotion ) {
					return;
				}
				const { ref } = getElement();
				if ( ref ) {
					ref.autoplay = false;
					ref.loop = false;
					ref.controls = true;
					ref.pause();
				}
			},
		},
	},
	{ lock: true }
);

mediaQuery?.addEventListener( 'change', ( event ) => {
	state.prefersReducedMotion = event.matches;
} );
