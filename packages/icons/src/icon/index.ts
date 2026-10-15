import { cloneElement, forwardRef } from '@wordpress/element';
import type { CSSProperties, ReactElement, RefAttributes } from 'react';
import type { SVGProps } from '@wordpress/primitives';

export interface IconProps extends SVGProps {
	/**
	 * The SVG component to render
	 */
	icon: ReactElement;
	/**
	 * The size of the icon in pixels
	 *
	 * @default 20
	 */
	size?: number;
}

/**
 * Return an SVG icon.
 *
 * @param props The component props.
 *
 * @return Icon component
 */
export default forwardRef< Element, IconProps >(
	( { icon, size = 20, style, ...props }: IconProps, ref ) => {
		const intrinsicStyle = ( icon.props as { style?: CSSProperties } )
			.style;
		const mergedStyle =
			intrinsicStyle || style
				? { ...intrinsicStyle, ...style }
				: undefined;

		return cloneElement( icon as ReactElement< RefAttributes< Element > >, {
			width: size,
			height: size,
			...props,
			// Merge styles so the icon's intrinsic style (e.g. `fill: none` on
			// stroke-based icons) is preserved unless the consumer overrides
			// the same property explicitly.
			...( mergedStyle ? { style: mergedStyle } : {} ),
			ref,
		} );
	}
);
