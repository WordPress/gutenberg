/**
 * Turns a list of detections into the single area a crop should protect.
 */

import type { Detection, SubjectArea } from './types';

/**
 * How small a detection may be, relative to the largest one, and still count
 * towards the subject.
 *
 * A face in the background of a portrait is a real face, and including it can
 * drag the protected area across the whole frame for no gain. Anything under a
 * fifth of the biggest face's area is treated as incidental.
 */
const RELATIVE_SIZE_FLOOR = 0.2;

/**
 * Combines detections into one rectangle, with the confidence to trust it.
 *
 * @param detections    Everything the detector returned.
 * @param minConfidence Detections scoring below this are ignored.
 * @return The area to keep in frame, or null if nothing scored high enough.
 */
export function toSubjectArea(
	detections: Detection[],
	minConfidence: number
): SubjectArea | null {
	const confident = detections.filter(
		( detection ) => detection.confidence >= minConfidence
	);

	if ( confident.length === 0 ) {
		return null;
	}

	const largestArea = Math.max(
		...confident.map( ( { width, height } ) => width * height )
	);
	const significant = confident.filter(
		( { width, height } ) =>
			width * height >= largestArea * RELATIVE_SIZE_FLOOR
	);

	const left = Math.min( ...significant.map( ( { x } ) => x ) );
	const top = Math.min( ...significant.map( ( { y } ) => y ) );
	const right = Math.max( ...significant.map( ( d ) => d.x + d.width ) );
	const bottom = Math.max( ...significant.map( ( d ) => d.y + d.height ) );

	return {
		x: left,
		y: top,
		width: right - left,
		height: bottom - top,
		confidence: Math.max(
			...significant.map( ( { confidence } ) => confidence )
		),
		source: 'face',
		detections: significant,
	};
}
