/**
 * External dependencies
 */
import type { CSSProperties, ReactNode } from 'react';

/**
 * Internal dependencies
 */
import type { ResponsiveCSSValue } from '../utils/types';
import type { SpaceInput } from '../utils/space';

export type FlexDirection = ResponsiveCSSValue<
	CSSProperties[ 'flexDirection' ]
>;

export type FlexProps = {
	/**
	 * Aligns children using CSS Flexbox `align-items`. Vertically aligns
	 * content if the `direction` is `row`, or horizontally aligns content if
	 * the `direction` is `column`.
	 *
	 * @default 'center'
	 */
	align?: CSSProperties[ 'alignItems' ];
	/**
	 * The direction flow of the children content can be adjusted with
	 * `direction`. `column` will align children vertically and `row` will align
	 * children horizontally.
	 *
	 * @default 'row'
	 */
	direction?: FlexDirection;
	/**
	 * Expands to the maximum available width (if horizontal) or height (if
	 * vertical).
	 *
	 * @default true
	 */
	expanded?: boolean;
	/**
	 * Spacing in between each child can be adjusted by using `gap`.
	 *
	 * Can either be a number (which will act as a multiplier to the library's
	 * grid system base of 4px), or a literal CSS value string.
	 *
	 * @default 2
	 */
	gap?: SpaceInput;
	/**
	 * Horizontally aligns content if the `direction` is `row`, or vertically
	 * aligns content if the `direction` is `column`.
	 *
	 * @default 'space-between'
	 */
	justify?: CSSProperties[ 'justifyContent' ];
	/**
	 * Determines if children should wrap.
	 *
	 * @default false
	 */
	wrap?: boolean;
	/**
	 * The children elements.
	 */
	children: ReactNode;
	/**
	 * @deprecated
	 */
	isReversed?: boolean;
};

export type FlexItemProps = {
	/**
	 * The (CSS) display of the `FlexItem`.
	 */
	display?: CSSProperties[ 'display' ];
	/**
	 * Determines if `FlexItem` should render as an adaptive full-width block.
	 *
	 * @default true
	 */
	isBlock?: boolean;
	/**
	 * The children elements.
	 */
	children?: ReactNode;
};

export type FlexBlockProps = Omit< FlexItemProps, 'isBlock' >;
