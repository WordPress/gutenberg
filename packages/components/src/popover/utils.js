/**
 * @typedef {import('../animate').AppearOrigin} AppearOrigin
 * @typedef {import('@floating-ui/react-dom').Placement} FloatingUIPlacement
 * @typedef {	'top left' | 'top center' | 'top right' | 'middle left' | 'middle center' | 'middle right' | 'bottom left' | 'bottom center' | 'bottom right' | 'bottom left' | 'bottom center' | 'bottom right' } LegacyPosition
 */

/**
 * Converts the `Popover`'s legacy "position" prop to the new "placement" prop
 * (used by `floating-ui`).
 *
 * @param {LegacyPosition} position The legacy position
 * @return {FloatingUIPlacement} The corresponding placement
 */
export const positionToPlacement = ( position ) => {
	const [ x, y, z ] = position.split( ' ' );

	if ( [ 'top', 'bottom' ].includes( x ) ) {
		let suffix = '';
		if ( ( !! z && z === 'left' ) || y === 'right' ) {
			suffix = '-start';
		} else if ( ( !! z && z === 'right' ) || y === 'left' ) {
			suffix = '-end';
		}

		// @ts-expect-error More TypeScript effort would be required to reconcile `string` and `Placement` types.
		return x + suffix;
	}

	// @ts-expect-error More TypeScript effort would be required to reconcile `string` and `Placement` types.
	return y;
};

/**
 * @typedef AnimationOrigin
 * @type {Object}
 * @property {number} originX A number between 0 and 1 (in CSS logical properties jargon, 0 is "start", 0.5 is "center", and 1 is "end")
 * @property {number} originY A number between 0 and 1 (0 is top, 0.5 is center, and 1 is bottom)
 */

/** @type {Object.<FloatingUIPlacement, {originX: number, originY: number}>} */
const PLACEMENT_TO_ANIMATION_ORIGIN = {
	top: { originX: 0.5, originY: 1 }, // open from bottom, center
	'top-start': { originX: 0, originY: 1 }, // open from bottom, left
	'top-end': { originX: 1, originY: 1 }, // open from bottom, right
	right: { originX: 0, originY: 0.5 }, // open from middle, left
	'right-start': { originX: 0, originY: 0 }, // open from top, left
	'right-end': { originX: 0, originY: 1 }, // open from bottom, left
	bottom: { originX: 0.5, originY: 0 }, // open from top, center
	'bottom-start': { originX: 0, originY: 0 }, // open from top, left
	'bottom-end': { originX: 1, originY: 0 }, // open from top, right
	left: { originX: 1, originY: 0.5 }, // open from middle, right
	'left-start': { originX: 1, originY: 0 }, // open from top, right
	'left-end': { originX: 1, originY: 1 }, // open from bottom, right
};

/**
 * Given the floating-ui `placement`, compute the framer-motion props for the
 * popover's entry animation.
 *
 * @param {FloatingUIPlacement} placement A placement string from floating ui
 * @return {import('framer-motion').MotionProps} The object containing the motion props
 */
export const placementToMotionAnimationProps = ( placement ) => {
	const translateProp =
		placement.startsWith( 'top' ) || placement.startsWith( 'bottom' )
			? 'translateY'
			: 'translateX';
	const translateDirection =
		placement.startsWith( 'top' ) || placement.startsWith( 'left' )
			? 1
			: -1;

	return {
		style: PLACEMENT_TO_ANIMATION_ORIGIN[ placement ],
		initial: {
			opacity: 0,
			scale: 0,
			[ translateProp ]: `${ 2 * translateDirection }em`,
		},
		animate: { opacity: 1, scale: 1, [ translateProp ]: 0 },
		transition: { duration: 0.1, ease: [ 0, 0, 0.2, 1 ] },
	};
};

/**
 * @typedef FrameOffset
 * @type {Object}
 * @property {number} x A numerical value representing the horizontal offset of the frame.
 * @property {number} y A numerical value representing the vertical offset of the frame.
 */

/**
 * Returns the offset of a document's frame element.
 *
 * @param {Document} document A document. This will usually be the document within an iframe.
 *
 * @return {FrameOffset|undefined} The offset of the document's frame element,
 *                                 or undefined if the document has no frame element.
 */
export const getFrameOffset = ( document ) => {
	const frameElement = document?.defaultView?.frameElement;
	if ( ! frameElement ) {
		return;
	}
	const iframeRect = frameElement.getBoundingClientRect();
	return { x: iframeRect.left, y: iframeRect.top };
};
