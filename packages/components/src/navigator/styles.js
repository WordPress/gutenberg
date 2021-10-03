/**
 * External dependencies
 */
import { css, keyframes } from '@emotion/react';

/**
 * WordPress dependencies
 */
import { isRTL } from '@wordpress/i18n';

const animationDuration = 0.14;
const animationEase = 'cubic-bezier(0, 0, 0.2, 1)';
const skimUnit = 'px';
const skimVector = isRTL() ? 50 : -50;

const fadeKeyframes = ( phase ) => keyframes`${ phase } { opacity: 0 }`;

const skimKeyframes = ( phase, vector ) =>
	keyframes`${ phase } { transform: translateX(${ vector }${ skimUnit }); }`;

export const animation = ( isCurrent, isBack ) => {
	const phase = isCurrent ? 'from' : 'to';
	let vector = isBack ? -skimVector : skimVector;
	vector *= isCurrent ? -1 : 1;
	const fade = fadeKeyframes( phase );
	const skim = skimKeyframes( phase, vector );
	return css`
		label: ${ phase }-${ vector === skimVector ? 'aft' : 'fore' };
		animation-name: ${ fade }, ${ skim };
		animation-duration: ${ animationDuration }s;
		animation-timing-function: ${ animationEase };
		animation-iteration-count: 1;
	`;
};

export const pointerNone = css`
	pointer-events: none;
`;

export const gridDeck = css`
	display: grid;
	grid-template: 1fr/1fr;
	> * {
		grid-area: 1/1;
	}
`;
