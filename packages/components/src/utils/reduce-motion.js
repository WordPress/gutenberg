/**
 * Allows users to opt-out of animations via OS-level preferences.
 *
 * @param {'transition' | 'animation' | string} [prop='transition'] CSS Property name
 * @return {string} Generated CSS code for the reduced style
 */
export function reduceMotion( prop = 'transition' ) {
	let style;

	switch ( prop ) {
		case 'transition':
			style = 'transition-duration: 0ms;';
			break;

		case 'animation':
			style = 'animation-duration: 1ms;';
			break;

		default:
			style = `
				animation-duration: 1ms;
				transition-duration: 0ms;
			`;
	}

	return `
		@media ( prefers-reduced-motion: reduce ) {
			${ style };
		}
	`;
}
