export type IconProps = React.ComponentProps< 'svg' > & {
	/**
	 * The icon to render, which must be an svg element or an `SVG` from `@wordpress/primitives`.
	 *
	 * In most cases, you should use an icon from
	 * [the `@wordpress/icons` package](https://wordpress.github.io/gutenberg/?path=/story/icons-icon--library).
	 */
	icon: React.ReactElement< React.ComponentProps< 'svg' > >;
	/**
	 * The size (width and height) of the icon.
	 * @default 24
	 */
	size?: number;
};
