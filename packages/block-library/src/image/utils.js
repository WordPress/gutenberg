/**
 * External dependencies
 */
import { isEmpty, each } from 'lodash';

/**
 * Internal dependencies
 */
import { NEW_TAB_REL } from './constants';

export function removeNewTabRel( currentRel ) {
	let newRel = currentRel;

	if ( currentRel !== undefined && ! isEmpty( newRel ) ) {
		if ( ! isEmpty( newRel ) ) {
			each( NEW_TAB_REL, ( relVal ) => {
				const regExp = new RegExp( '\\b' + relVal + '\\b', 'gi' );
				newRel = newRel.replace( regExp, '' );
			} );

			// Only trim if NEW_TAB_REL values was replaced.
			if ( newRel !== currentRel ) {
				newRel = newRel.trim();
			}

			if ( isEmpty( newRel ) ) {
				newRel = undefined;
			}
		}
	}

	return newRel;
}

/**
 * Helper to get the link target settings to be stored.
 *
 * @param {boolean} value         The new link target value.
 * @param {Object} attributes     Block attributes.
 * @param {Object} attributes.rel Image block's rel attribute.
 *
 * @return {Object} Updated link target settings.
 */
export function getUpdatedLinkTargetSettings( value, { rel } ) {
	const linkTarget = value ? '_blank' : undefined;

	let updatedRel;
	if ( ! linkTarget && ! rel ) {
		updatedRel = undefined;
	} else {
		updatedRel = removeNewTabRel( rel );
	}

	return {
		linkTarget,
		rel: updatedRel,
	};
}

/**
 * Rotate a point around a center point.
 *
 * @param {number} angle Angle to rotate in radians
 * @param {Object} center Center point to rotate around
 * @param {number} center.x Horizontal coordinate of the center point
 * @param {number} center.y Vertical coordinate of the center point
 * @param {Object} point Point to rotate
 * @param {number} point.x Horizontal coordinate of the point to rotate
 * @param {number} point.y Vertical coordinate of the point to rotate
 *
 * @return {Object} Rotated (x,y) coordinate
 */
export function rotatePoint( angle, center, point ) {
	return {
		x:
			Math.cos( angle ) * ( point.x - center.x ) -
			Math.sin( angle ) * ( point.y - center.y ) +
			center.x,
		y:
			Math.sin( angle ) * ( point.x - center.x ) +
			Math.cos( angle ) * ( point.y - center.y ) +
			center.y,
	};
}

/**
 * Calculate the bounding box of a rectangle rotated around its center.
 *
 * @param {number} angle       Angle to rotate in radians
 * @param {Object} size        Rectangle size
 * @param {number} size.width  Rectangle width
 * @param {number} size.height Rectangle height
 *
 * @return {Object} Bounding box position and size
 */
export function getBoundingBox( angle, { width, height } ) {
	const center = {
		x: width / 2,
		y: height / 2,
	};

	const p0 = { x: 0, y: 0 };
	const p1 = { x: width, y: 0 };
	const p2 = { x: 0, y: height };
	const p3 = { x: width, y: height };

	const q0 = rotatePoint( angle, center, p0 );
	const q1 = rotatePoint( angle, center, p1 );
	const q2 = rotatePoint( angle, center, p2 );
	const q3 = rotatePoint( angle, center, p3 );

	const x0 = Math.min( q0.x, q1.x, q2.x, q3.x );
	const x1 = Math.max( q0.x, q1.x, q2.x, q3.x );
	const y0 = Math.min( q0.y, q1.y, q2.y, q3.y );
	const y1 = Math.max( q0.y, q1.y, q2.y, q3.y );

	return {
		x: x0,
		y: y0,
		width: x1 - x0,
		height: y1 - y0,
	};
}

/**
 * Convert from percentages relative to the un-rotated image that react-easy-crop
 * uses to percentages of the rotated image that the REST API uses.
 *
 * @param {number} angleDeg    Angle to rotate counterclockwise in degrees
 * @param {Object} size        Rectangle size
 * @param {number} size.width  Rectangle width
 * @param {number} size.height Rectangle height
 * @param {Object} crop        Crop position and size
 * @param {number} crop.width  Crop width
 * @param {number} crop.height Crop height
 * @param {number} crop.x      Crop horizontal coordinate
 * @param {number} crop.y      Crop vertical coordinate
 *
 * @return {Object} New crop position and size in the new coordinate system
 */
export function convertCropCoordinateSystem( angleDeg, size, crop ) {
	const angle = angleDeg * ( Math.PI / 180 );
	const box = getBoundingBox( angle, size );
	return {
		x: ( crop.x * size.width - 100 * box.x ) / box.width,
		y: ( crop.y * size.height - 100 * box.y ) / box.height,
		width: ( crop.width * size.width ) / box.width,
		height: ( crop.height * size.height ) / box.height,
	};
}
