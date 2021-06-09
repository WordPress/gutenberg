/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import type { CSSProperties } from 'react';

/**
 * Internal dependencies
 */
import type { Props as SurfaceProps } from '../surface/types';

export type SizeOptions = 'xSmall' | 'small' | 'medium' | 'large';

type SizeableProps = {
	/**
	 * Determines the amount of padding within the component.
	 *
	 * @default 'medium'
	 */
	size?: SizeOptions;
};

export type Props = SurfaceProps &
	SizeableProps & {
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
	 * @default true
	 */
	isScrollable?: boolean;
};

type MarginalSubComponentProps = BaseSubComponentProps & {
	/**
	 * Renders without a border.
	 *
	 * @default false
	 */
	isBorderless?: boolean;
	className?: string;
};

export type HeaderProps = MarginalSubComponentProps;

export type FooterProps = MarginalSubComponentProps & {
	justify: CSSProperties[ 'justifyContent' ];
};

export type MediaProps = {
	/**
	 * The children elements.
	 */
	children: React.ReactNode;
};
