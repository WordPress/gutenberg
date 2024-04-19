/**
 * Allows users to opt-out of animations via OS-level preferences.
 *
 * @param {'transition' | 'animation' | string} [prop='transition'] CSS Property name
 * @return {string} Generated CSS code for the reduced style
 *
 * @deprecated Write your own media query instead,
 * e.g. `@media not ( prefers-reduced-motion ) { ...some animation... }` or
 * `@media ( prefers-reduced-motion ) { ...reduced animation... }`.
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
