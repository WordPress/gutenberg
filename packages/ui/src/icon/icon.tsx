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
	const mergedStyle =
		icon.props.style || style
			? { ...icon.props.style, ...style }
			: undefined;

	return (
		<SVG
			ref={ ref }
			{ ...icon.props }
			{ ...restProps }
			{ ...( mergedStyle ? { style: mergedStyle } : {} ) }
			width={ size }
			height={ size }
		/>
	);
} );
