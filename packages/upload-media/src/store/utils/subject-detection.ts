/**
 * Finds the area of an image that a hard crop should keep in frame.
 *
 * Detection is a separate module because it loads an inference runtime, which
 * is worth fetching only once an upload actually reaches a hard-cropped size.
 * Everything here is best effort: a failure to detect leaves the crop where it
 * would have been, and must never fail the upload.
 */

import type { SubjectArea } from '../types';

/**
 * Cached dynamic import promise for the detector.
 */
let detectorPromise:
	| Promise< typeof import('@wordpress/subject-detection/detector') >
	| undefined;

/**
 * Detection results, keyed by the file they came from.
 *
 * A single upload produces one queue item per registered size, and they share
 * the file they were cut from, so the same image would otherwise be inspected
 * several times over.
 */
const cache = new WeakMap< File, Promise< SubjectArea | null > >();

/**
 * Lazily loads and caches the detector module.
 *
 * @return The detector module.
 */
function loadDetector() {
	if ( ! detectorPromise ) {
		detectorPromise = import( '@wordpress/subject-detection/detector' );
	}
	return detectorPromise;
}

/**
 * Finds the subject of an image, if there is one to find.
 *
 * @param file      The image being cropped.
 * @param assetsUrl Base URL the detection model and runtime are served from.
 * @return The area to keep in frame, or null when nothing was found.
 */
export function detectSubjectArea(
	file: File,
	assetsUrl: string
): Promise< SubjectArea | null > {
	let detection = cache.get( file );

	if ( ! detection ) {
		detection = loadDetector()
			.then( ( { detectSubject } ) =>
				detectSubject( file, { assetsUrl } )
			)
			.then( ( subject ) =>
				subject
					? {
							x: subject.x,
							y: subject.y,
							width: subject.width,
							height: subject.height,
					  }
					: null
			)
			.catch( () => null );
		cache.set( file, detection );
	}

	return detection;
}
