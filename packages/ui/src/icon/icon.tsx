import { forwardRef } from '@wordpress/element';
import { SVG } from '@wordpress/primitives';
import type { IconProps } from './types';

/**
 * Renders an SVG icon with a 24px default size.
 *
 * ```jsx
 * import { wordpress } from '@wordpress/icons';
 *
 * <Icon icon={ wordpress } />
 * ```
 */
export const Icon = forwardRef< SVGSVGElement, IconProps >( function Icon(
	{ icon, size = 24, style, ...restProps },
	ref
) {
	return (
		<SVG
			ref={ ref }
			{ ...icon.props }
			{ ...restProps }
			style={ { ...icon.props.style, ...style } }
			width={ size }
			height={ size }
		/>
	);
} );
