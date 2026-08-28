import type { ComponentType, CSSProperties, HTMLProps, SVGProps } from 'react';
import {
	cloneElement,
	createElement,
	isValidElement,
} from '@wordpress/element';
import { SVG } from '@wordpress/primitives';
import Dashicon from '../dashicon';
import type { IconKey as DashiconIconKey } from '../dashicon/types';

export type IconType =
	| DashiconIconKey
	| ComponentType< { size?: number } >
	| ( ( props: { size?: number } ) => React.JSX.Element )
	| React.JSX.Element;

/* The sizing props forwarded to an icon element that is not an `SVG` or a `Dashicon`. */
type SizeProps = {
	size?: number;
	width?: number | string;
	height?: number | string;
	style?: CSSProperties;
};

type AdditionalProps< T > = T extends ComponentType< infer U >
	? U
	: T extends DashiconIconKey
	? SVGProps< SVGSVGElement >
	: {};

export type Props = {
	/**
	 * The icon to render. In most cases, you should use an icon from
	 * [the `@wordpress/icons` package](https://wordpress.github.io/gutenberg/?path=/story/icons-icon--library).
	 *
	 * Other supported values are: component instances, functions,
	 * [Dashicons](https://developer.wordpress.org/resource/dashicons/)
	 * (specified as strings), and `null`.
	 *
	 * The `size` value, as well as any other additional props, will be passed through.
	 *
	 * @default null
	 */
	icon?: IconType | null;
	/**
	 * The size (width and height) of the icon.
	 *
	 * Defaults to `20` when `icon` is a string (i.e. a Dashicon id), otherwise `24`.
	 *
	 * @default `'string' === typeof icon ? 20 : 24`.
	 */
	size?: number;
} & AdditionalProps< IconType >;

/**
 * Renders a raw icon without any initial styling or wrappers.
 *
 * ```jsx
 * import { wordpress } from '@wordpress/icons';
 *
 * <Icon icon={ wordpress } />
 * ```
 */
function Icon( {
	icon = null,
	size = 'string' === typeof icon ? 20 : 24,
	...additionalProps
}: Props ) {
	if ( 'string' === typeof icon ) {
		return (
			<Dashicon
				icon={ icon }
				size={ size }
				{ ...( additionalProps as HTMLProps< HTMLSpanElement > ) }
			/>
		);
	}

	if ( isValidElement( icon ) && Dashicon === icon.type ) {
		return cloneElement( icon, {
			...additionalProps,
		} );
	}

	if ( 'function' === typeof icon ) {
		return createElement( icon, {
			size,
			...additionalProps,
		} );
	}

	if ( isValidElement< SizeProps >( icon ) ) {
		const { style: consumerStyle, ...restProps } =
			additionalProps as SVGProps< SVGSVGElement >;
		const mergedStyle =
			icon.props.style || consumerStyle
				? { ...icon.props.style, ...consumerStyle }
				: undefined;
		const styleProps = mergedStyle ? { style: mergedStyle } : {};

		if ( icon.type === 'svg' || icon.type === SVG ) {
			const appliedProps = {
				...icon.props,
				width: size,
				height: size,
				...restProps,
				// Merge styles so the icon's intrinsic style (e.g. `fill: none` on
				// stroke-based icons) is preserved unless the consumer overrides
				// the same property explicitly.
				...styleProps,
			};

			return <SVG { ...appliedProps } />;
		}

		return cloneElement( icon, {
			size,
			width: size,
			height: size,
			...restProps,
			// Merge styles so the icon's intrinsic style is preserved unless
			// the consumer overrides the same property explicitly.
			...styleProps,
		} );
	}

	return icon;
}

export default Icon;
