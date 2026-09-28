/**
 * CSS style object that visually hides an element while keeping it accessible
 * to screen readers.
 */
export const VISUALLY_HIDDEN_STYLE: React.CSSProperties = {
	position: 'absolute',
	width: 1,
	height: 1,
	padding: 0,
	margin: -1,
	overflow: 'hidden',
	clip: 'rect(0, 0, 0, 0)',
	whiteSpace: 'nowrap',
	border: 0,
};
