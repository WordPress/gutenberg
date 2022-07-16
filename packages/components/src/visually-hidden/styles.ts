/**
 * External dependencies
 */
import type { CSSProperties } from 'react';

export const visuallyHidden: CSSProperties = {
	border: 0,
	clip: 'rect(1px, 1px, 1px, 1px)',
	WebkitClipPath: 'inset( 50% )',
	clipPath: 'inset( 50% )',
	height: '1px',
	margin: '-1px',
	overflow: 'hidden',
	padding: 0,
	position: 'absolute',
	width: '1px',
	wordWrap: 'normal',
};
