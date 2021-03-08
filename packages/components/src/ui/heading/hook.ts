/**
 * External dependencies
 */
import { useContextSystem } from '@wp-g2/context';
import { getHeadingFontSize, ui } from '@wp-g2/styles';
import type { ViewOwnProps } from '@wp-g2/create-styles';

/**
 * Internal dependencies
 */
import type { Props as TextProps } from '../text/types';
import { useText } from '../text';

export type HeadingSize =
	| 1
	| 2
	| 3
	| 4
	| 5
	| 6
	| '1'
	| '2'
	| '3'
	| '4'
	| '5'
	| '6';

export interface HeadingProps extends Omit< TextProps, 'size' > {
	/**
	 * `Heading` will typically render the sizes `1`, `2`, `3`, `4`, `5`, or `6`, which map to `h1`-`h6`.
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
	 *       <Heading level="1">Code is Poetry</Heading>
	 *       <Heading level="2">Code is Poetry</Heading>
	 *       <Heading level="3">Code is Poetry</Heading>
	 *       <Heading level="4">Code is Poetry</Heading>
	 *       <Heading level="5">Code is Poetry</Heading>
	 *       <Heading level="6">Code is Poetry</Heading>
	 *     </View>
	 *   );
	 * }
	 * ```
	 */
	level: HeadingSize;
}

export function useHeading( props: ViewOwnProps< HeadingProps, 'h1' > ) {
	const { as: asProp, level = 2, ...otherProps } = useContextSystem(
		props,
		'Heading'
	);

	const as = asProp || `h${ level }`;
	const textProps = useText( {
		color: ui.get( 'colorTextHeading' ),
		size: getHeadingFontSize( level ),
		isBlock: true,
		// @ts-ignore We're passing a variable so `string` is safe
		weight: ui.get( 'fontWeightHeading' ),
		...otherProps,
	} );

	return { ...textProps, as };
}
