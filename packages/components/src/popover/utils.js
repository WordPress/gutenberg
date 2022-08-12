/**
 * @typedef {import('../animate').AppearOrigin} AppearOrigin
 * @typedef {import('@floating-ui/react-dom').Placement} FloatingUIPlacement
 */

/**
 * @typedef AnimationOrigin
 * @type {Object}
 * @property {number} originX A number between 0 and 1 (in RTL direction, 0 is left, 0.5 is center, and 1 is right)
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
	return {
		style: PLACEMENT_TO_ANIMATION_ORIGIN[ placement ],
		initial: { scale: 0 },
		animate: { scale: 1 },
		transition: { duration: 0.1, ease: [ 0, 0, 0.2, 1 ] },
	};
};
