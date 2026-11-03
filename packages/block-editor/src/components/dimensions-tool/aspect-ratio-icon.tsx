import { Icon, aspectRatio as aspectRatioIcon } from '@wordpress/icons';
import { parseAspectRatio } from './utils';

// The icon is drawn inside a 24px box, leaving a 4px margin on every side.
const BOX_SIZE = 24;
const MAX_SIDE = 16;
const STROKE_WIDTH = 1.5;
// Keeps very wide or very tall ratios from collapsing into a line.
const MIN_RATIO = 1 / 3;
const MAX_RATIO = 3;

/**
 * Renders a rounded rectangle with the shape of an aspect ratio, so that a
 * ratio can be recognized without reading its label.
 *
 * @param props       Component props.
 * @param props.ratio CSS `aspect-ratio` value, e.g. '16/9'. Values that are
 *                    not a ratio, like 'auto', get the generic icon.
 */
export default function AspectRatioIcon( { ratio }: { ratio: string } ) {
	const parsedRatio = parseAspectRatio( ratio );

	if ( parsedRatio === null ) {
		return <Icon icon={ aspectRatioIcon } size={ BOX_SIZE } />;
	}

	const clampedRatio = Math.min(
		MAX_RATIO,
		Math.max( MIN_RATIO, parsedRatio )
	);
	const width = clampedRatio >= 1 ? MAX_SIDE : MAX_SIDE * clampedRatio;
	const height = clampedRatio >= 1 ? MAX_SIDE / clampedRatio : MAX_SIDE;

	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox={ `0 0 ${ BOX_SIZE } ${ BOX_SIZE }` }
			width={ BOX_SIZE }
			height={ BOX_SIZE }
			fill="none"
			stroke="currentColor"
			strokeWidth={ STROKE_WIDTH }
			aria-hidden="true"
			focusable="false"
		>
			<rect
				x={ ( BOX_SIZE - width ) / 2 }
				y={ ( BOX_SIZE - height ) / 2 }
				width={ width }
				height={ height }
				rx="1.5"
			/>
		</svg>
	);
}
