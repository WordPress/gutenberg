import type { Flip, NormalizedRect } from './core/types';
import type { ImageEdit } from './get-image-edit';

/**
 * Turn each part of an edit into the consumer's own format, in the order the
 * parts apply: flip, then rotation, then crop.
 *
 * Use it to build instructions for something that applies them one at a
 * time, such as the `modifiers` sent to the WordPress media REST endpoint.
 * The order is not a choice: `rotation` is measured after the flip, and
 * `crop` is a fraction of the image after both, so another order frames a
 * different part of the image.
 *
 * @param edit              The edit, as returned by `getImageEdit`.
 * @param handlers          One function for each part, called only when the
 *                          edit has that part.
 * @param handlers.flip     Turns the flip into the consumer's format.
 * @param handlers.rotation Turns the rotation, in degrees, into it.
 * @param handlers.crop     Turns the crop into it.
 * @return What the handlers returned, in the order the parts apply.
 */
export function mapImageEdit< T >(
	edit: ImageEdit,
	handlers: {
		flip: ( flip: Flip ) => T;
		rotation: ( rotation: number ) => T;
		crop: ( crop: NormalizedRect ) => T;
	}
): T[] {
	const result: T[] = [];
	if ( edit.flip ) {
		result.push( handlers.flip( edit.flip ) );
	}
	if ( edit.rotation !== undefined ) {
		result.push( handlers.rotation( edit.rotation ) );
	}
	if ( edit.crop ) {
		result.push( handlers.crop( edit.crop ) );
	}
	return result;
}
