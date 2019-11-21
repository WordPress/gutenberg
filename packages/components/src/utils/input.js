/**
 * Internal dependencies
 */
import { rgba } from './colors';
import { reduceMotion } from './reduce-motion';
import { borderRadius } from './borderRadius';

/* Use opacity to work in various editor styles */
const placeholderColor = rgba( '#0e1c2e', 0.62 );

export const inputPlaceholder = () => `
	/* individual definitions seem necessary, otherwise chrome doesn't seem to apply the styles */

	::placeholder {
		color: ${ placeholderColor };
	}

	&::-webkit-input-placeholder {
		color: ${ placeholderColor };
	}

	::-moz-placeholder {
		color: ${ placeholderColor };
		opacity: 1; /* Necessary because Firefox reduces this from 1 */
	}

	:-ms-input-placeholder {
		color: ${ placeholderColor };
	}

`;

export const inputOutline = () => `
	box-shadow: 0 0 0 transparent;
	transition: box-shadow 0.1s linear;
	border-radius: ${ borderRadius };
	border: 1px solid #7e8993;
	${ reduceMotion( 'transition' ) };
`;

export const focusedInputOutline = () => `
	color: #191e23;
	border-color: #007cba;
	box-shadow: 0 0 0 1px #007cba;
	/* Windows High Contrast mode will show this outline, but not the box-shadow */
	outline: 2px solid transparent;
`;
