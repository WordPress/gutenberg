import { Rect, SVG } from '@wordpress/primitives';
import aspectRatio from '../library/aspect-ratio';
import { BOX_SIZE, getAspectRatioShape } from './utils';

const CORNER_RADIUS = 1.25;

/**
 * Returns an icon that draws the shape of an aspect ratio, so that a ratio can
 * be recognized without reading its label. Pass the result to `Icon`, like any
 * other icon.
 *
 * A value that is not a positive number, such as `0`, gets the generic
 * `aspectRatio` icon. Ratios are clamped between 1:3 and 3:1, so that a very
 * wide or very tall ratio is still visible.
 *
 * ```jsx
 * <Icon icon={ getAspectRatioIcon( 16 / 9 ) } />
 * ```
 *
 * @param ratio The aspect ratio, as width divided by height, e.g. `16 / 9`.
 */
export default function getAspectRatioIcon( ratio?: number | null ) {
	const shape = getAspectRatioShape( ratio );

	if ( ! shape ) {
		return aspectRatio;
	}

	return (
		<SVG
			xmlns="http://www.w3.org/2000/svg"
			viewBox={ `0 0 ${ BOX_SIZE } ${ BOX_SIZE }` }
			// Set inline, as for the other stroke icons: a `fill` rule from a
			// parent, such as `.components-button svg`, overrides the attribute.
			style={ { fill: 'none' } }
			stroke="currentColor"
			strokeWidth="1.5"
		>
			<Rect { ...shape } rx={ CORNER_RADIUS } />
		</SVG>
	);
}
