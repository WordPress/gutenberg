import { Icon, aspectRatio as aspectRatioIcon } from '@wordpress/icons';
import type { AspectRatioIconProps } from './types';
import { BOX_SIZE, getAspectRatioShape } from './utils';

const STROKE_WIDTH = 1.5;
const CORNER_RADIUS = 1.25;

/**
 * Renders a rounded rectangle with the shape of an aspect ratio, so that a
 * ratio can be recognized without reading its label.
 *
 * @param props       Component props.
 * @param props.ratio The aspect ratio, as width divided by height.
 */
function AspectRatioIcon( { ratio, ...props }: AspectRatioIconProps ) {
	const shape = getAspectRatioShape( ratio );

	if ( ! shape ) {
		return <Icon icon={ aspectRatioIcon } size={ BOX_SIZE } { ...props } />;
	}

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
			{ ...props }
		>
			<rect { ...shape } rx={ CORNER_RADIUS } />
		</svg>
	);
}

export default AspectRatioIcon;
