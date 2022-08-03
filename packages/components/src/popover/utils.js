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

		// @ts-ignore
		return x + suffix;
	}

	// @ts-ignore
	return y;
};

/** @type {Object.<FloatingUIPlacement, AppearOrigin>} */
const PLACEMENT_TO_ANIMATION_ORIGIN_MAP = {
	top: 'bottom',
	'top-start': 'bottom left',
	'top-end': 'bottom right',
	right: 'middle left',
	'right-start': 'top left',
	'right-end': 'bottom left',
	bottom: 'top',
	'bottom-start': 'top left',
	'bottom-end': 'top right',
	left: 'middle right',
	'left-start': 'top right',
	'left-end': 'bottom right',
};

/**
 * Given the floating-ui `placement`, compute the origin used for the entrance
 * animation. The origin should be on the "opposite" side from the placement.
 *
 * @param {FloatingUIPlacement} placement A placement string from floating ui
 * @param {boolean}             rtl
 * @return {AppearOrigin} The Animation origin string
 */
export const placementToAnimationOrigin = ( placement, rtl ) => {
	/** @type {AppearOrigin} */
	let animationOrigin =
		PLACEMENT_TO_ANIMATION_ORIGIN_MAP[ placement ] ?? 'middle';

	if ( rtl && /left/gi.test( animationOrigin ) ) {
		/** @type {AppearOrigin} */
		animationOrigin = /** @type {AppearOrigin} */ (
			animationOrigin.replace( /left/gi, 'right' )
		);
	} else if ( rtl && /right/gi.test( animationOrigin ) ) {
		animationOrigin = /** @type {AppearOrigin} */ (
			animationOrigin.replace( /right/gi, 'left' )
		);
	}

	return animationOrigin;
};

/**
 * @param {FloatingUIPlacement} placement
 * @return {'top' | 'right' | 'bottom' | 'left'} The side
 */
function getSide( placement ) {
	// @ts-ignore
	return placement.split( '-' )[ 0 ];
}

/**
 * @param {FloatingUIPlacement} placement
 * @return {'x' | 'y'} The axis
 */
export function getMainAxisFromPlacement( placement ) {
	return [ 'top', 'bottom' ].includes( getSide( placement ) ) ? 'x' : 'y';
}
