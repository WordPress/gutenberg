/**
 * Places a fixed-size crop window inside an image.
 *
 * WordPress crops hard-cropped sizes from the centre of the frame, which is
 * the right default when nothing is known about the picture. This positions
 * the window using what a detector found, but treats that as a guard rather
 * than as a target: the window starts centred and only moves when the subject
 * would otherwise be cut, and then only far enough to bring it back.
 *
 * That is deliberate. A strategy that recentres on whatever it considers most
 * interesting changes every crop, including the ones that were already fine,
 * and each of those changes is a chance to make the picture worse. Moving only
 * when there is something to rescue means the worst case is the crop
 * WordPress would have produced anyway.
 */

import type { SubjectArea } from './types';

/**
 * How much room to leave around the subject, as a fraction of its size.
 *
 * A face cropped to its exact bounding box reads as a mistake even though the
 * box survived, so the area to protect is the subject plus a margin.
 */
const DEFAULT_PADDING = 0.5;

interface PlaceCropWindowArgs {
	/**
	 * Width of the image the window is being placed in.
	 */
	imageWidth: number;
	/**
	 * Height of the image the window is being placed in.
	 */
	imageHeight: number;
	/**
	 * Width of the window.
	 */
	cropWidth: number;
	/**
	 * Height of the window.
	 */
	cropHeight: number;
	/**
	 * The area to keep in frame, as fractions of the image. When absent the
	 * window is centred, which is WordPress's existing behaviour.
	 */
	subject?: SubjectArea;
	/**
	 * Margin to leave around the subject, as a fraction of its size.
	 */
	padding?: number;
}

/**
 * Works out where a crop window of the given size should sit.
 *
 * @param args             Image size, window size, and the subject to protect.
 * @param args.imageWidth
 * @param args.imageHeight
 * @param args.cropWidth
 * @param args.cropHeight
 * @param args.subject
 * @param args.padding
 * @return The top left corner of the window, in image pixels.
 */
export function placeCropWindow( {
	imageWidth,
	imageHeight,
	cropWidth,
	cropHeight,
	subject,
	padding = DEFAULT_PADDING,
}: PlaceCropWindowArgs ): { left: number; top: number } {
	const centreLeft = ( imageWidth - cropWidth ) / 2;
	const centreTop = ( imageHeight - cropHeight ) / 2;

	if ( ! subject ) {
		return { left: centreLeft, top: centreTop };
	}

	const subjectLeft = subject.x * imageWidth;
	const subjectTop = subject.y * imageHeight;
	const subjectWidth = subject.width * imageWidth;
	const subjectHeight = subject.height * imageHeight;

	const padX = subjectWidth * padding;
	const padY = subjectHeight * padding;

	return {
		left: placeAxis(
			centreLeft,
			cropWidth,
			subjectLeft - padX,
			subjectLeft + subjectWidth + padX,
			imageWidth
		),
		top: placeAxis(
			centreTop,
			cropHeight,
			subjectTop - padY,
			subjectTop + subjectHeight + padY,
			imageHeight
		),
	};
}

/**
 * Positions the window along one axis.
 *
 * @param centred    Where the window sits when centred.
 * @param windowSize Length of the window on this axis.
 * @param boxStart   Near edge of the area to protect.
 * @param boxEnd     Far edge of the area to protect.
 * @param imageSize  Length of the image on this axis.
 * @return Where the window starts, clamped inside the image.
 */
function placeAxis(
	centred: number,
	windowSize: number,
	boxStart: number,
	boxEnd: number,
	imageSize: number
): number {
	const boxSize = boxEnd - boxStart;
	let start = centred;

	if ( boxSize >= windowSize ) {
		// Too big to keep whole. Centring on it is the best available.
		start = boxStart + boxSize / 2 - windowSize / 2;
	} else if ( boxStart < start ) {
		start = boxStart;
	} else if ( boxEnd > start + windowSize ) {
		start = boxEnd - windowSize;
	}

	return Math.max( 0, Math.min( imageSize - windowSize, start ) );
}
