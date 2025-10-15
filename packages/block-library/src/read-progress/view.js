if ( ! ( 'ScrollTimeline' in window ) ) {
	/**
	 * Internal dependencies
	 */
	require( './utils/polyfill' );

	document.addEventListener( 'DOMContentLoaded', initScrollAnimation );
} else {
	document.addEventListener( 'DOMContentLoaded', initScrollAnimation );
}

function initScrollAnimation() {
	const progressBar = document.querySelector(
		'.wp-block-read-progress__progress-style'
	);

	// eslint-disable-next-line no-undef
	const scrollTimeline = new ScrollTimeline( {
		source: document.scrollingElement,
		axis: 'block',
		start: '0%',
		end: '100%',
	} );

	progressBar.animate(
		{ transform: [ 'scaleX(0)', 'scaleX(1)' ] },
		{
			timeline: scrollTimeline,
			easing: 'linear',
		}
	);
}
