import { forwardRef } from '@wordpress/element';
import { SVG } from '@wordpress/primitives';
import type { IconProps } from './types';

/**
 * Renders an SVG icon with a 24px default size.
 *
 * If no `fill` colors are explicitly set on the icon itself, it will be rendered with a `currentColor` fill.
 *
 * ```jsx
 * import { wordpress } from '@wordpress/icons';
 *
 * <Icon icon={ wordpress } />
 * ```
 */
export const Icon = forwardRef< SVGSVGElement, IconProps >( function Icon(
	{ icon, size = 24, ...restProps },
	ref
) {
	return (
		<SVG
			ref={ ref }
			fill="currentColor"
			{ ...icon.props }
			{ ...restProps }
			width={ size }
			height={ size }
		/>
	);
} );
