/**
 * External dependencies
 */
import { useContextSystem } from '@wp-g2/context';
import { getHeadingFontSize, ui } from '@wp-g2/styles';
import type { ViewOwnProps } from '@wp-g2/create-styles';
// eslint-disable-next-line no-restricted-imports
import type { CSSProperties } from 'react';

/**
 * Internal dependencies
 */
import type { Props as TextProps, TextSize } from '../text/types';
import { useText } from '../text';

export type HeadingSize = 1 | 2 | 3 | 4 | 5 | 6;

export interface HeadingProps extends TextProps {
	/**
	 * `Heading` will typically render the sizes `1`, `2`, `3`, `4`, `5`, or `6`, which map to `h1`-`h6`. However, it can render any size, including non `px` values.
	 *
	 * @default 3
	 *
	 * @example
	 * ```jsx
	 * import { Heading, View } from `@wp-g2/components`
	 *
	 * function Example() {
	 *   return (
	 *     <View>
	 *       <Heading size={1}>Into The Unknown</Heading>
	 *       <Heading size={2}>Into The Unknown</Heading>
	 *       <Heading size={3}>Into The Unknown</Heading>
	 *       <Heading size={4}>Into The Unknown</Heading>
	 *       <Heading size={5}>Into The Unknown</Heading>
	 *       <Heading size={6}>Into The Unknown</Heading>
	 *     </View>
	 *   );
	 * }
	 * ```
	 */
	size: HeadingSize | TextSize | CSSProperties[ 'fontSize' ];
}

export function useHeading( props: ViewOwnProps< HeadingProps, 'div' > ) {
	const { size = 3, ...otherProps } = useContextSystem( props, 'Heading' );

	const textProps = useText( {
		color: ui.get( 'colorTextHeading' ),
		size: getHeadingFontSize( size ),
		isBlock: true,
		// @ts-ignore We're passing a variable so `string` is safe
		weight: ui.get( 'fontWeightHeading' ),
		...otherProps,
	} );

	return textProps;
}
