/**
 * External dependencies
 */
import type { CSSProperties } from 'react';

/**
 * Internal dependencies
 */
import type { SurfaceProps } from '../surface/types';

type DeprecatedSizeOptions = 'extraSmall';
export type SizeOptions = 'xSmall' | 'small' | 'medium' | 'large';

type SizeableProps = {
	/**
	 * Determines the amount of padding within the component.
	 *
	 * @default 'medium'
	 */
	size?: SizeOptions | DeprecatedSizeOptions;
};

export type Props = SurfaceProps &
	SizeableProps & {
		/**
		 * Size of the elevation shadow, based on the Style system's elevation system.
		 * Elevating a `Card` can be done by adjusting the `elevation` prop. This may
		 * be helpful in highlighting certain content. For more information, check out
		 * `Elevation`.
		 *
		 * @default 0
		 */
		elevation?: number;
		/**
		 * Renders without a border.
		 *
		 * @default false
		 */
		isBorderless?: boolean;
		/**
		 * Renders with rounded corners.
		 *
		 * @default true
		 */
		isRounded?: boolean;
		/**
		 * Renders with elevation styles (box shadow).
		 *
		 * @default false
		 * @deprecated
		 */
		isElevated?: boolean;
	};

type BaseSubComponentProps = SizeableProps & {
	/**
	 * The children elements.
	 */
	children: React.ReactNode;
	/**
	 * Renders with a light gray background color.
	 *
	 * @default false
	 */
	isShady?: boolean;
};

export type BodyProps = BaseSubComponentProps & {
	/**
	 * Determines if the component is scrollable.
	 *
	 * @default false
	 */
	isScrollable?: boolean;
};

export type MediaProps = {
	/**
	 * The children elements.
	 */
	children: React.ReactNode;
};

type MarginalSubComponentProps = BaseSubComponentProps & {
	/**
	 * Renders without a border.
	 *
	 * @default false
	 */
	isBorderless?: boolean;
};

export type HeaderProps = MarginalSubComponentProps;

export type FooterProps = MarginalSubComponentProps & {
	justify?: CSSProperties[ 'justifyContent' ];
};
