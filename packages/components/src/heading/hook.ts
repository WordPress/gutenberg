/**
 * Internal dependencies
 */
import { useContextSystem, WordPressComponentProps } from '../ui/context';
import type { Props as TextProps } from '../text/types';
import { useText } from '../text';
import { getHeadingFontSize } from '../ui/utils/font-size';
import { CONFIG, COLORS } from '../utils';

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
	 * @default 2
	 *
	 * @example
	 * ```jsx
	 * import { __experimentalHeading as Heading } from `@wordpress/components`
	 *
	 * function Example() {
	 *   return (
	 *     <div>
	 *       <Heading level="1">Code is Poetry</Heading>
	 *       <Heading level="2">Code is Poetry</Heading>
	 *       <Heading level="3">Code is Poetry</Heading>
	 *       <Heading level="4">Code is Poetry</Heading>
	 *       <Heading level="5">Code is Poetry</Heading>
	 *       <Heading level="6">Code is Poetry</Heading>
	 *     </div>
	 *   );
	 * }
	 * ```
	 */
	level: HeadingSize;
}

export function useHeading(
	props: WordPressComponentProps< HeadingProps, 'h1' >
) {
	const { as: asProp, level = 2, ...otherProps } = useContextSystem(
		props,
		'Heading'
	);

	const as = ( asProp || `h${ level }` ) as keyof JSX.IntrinsicElements;

	const a11yProps: {
		role?: string;
		'aria-level'?: number;
	} = {};
	if ( typeof as === 'string' && as[ 0 ] !== 'h' ) {
		// If not a semantic `h` element, add a11y props:
		a11yProps.role = 'heading';
		a11yProps[ 'aria-level' ] =
			typeof level === 'string' ? parseInt( level ) : level;
	}

	const textProps = useText( {
		color: COLORS.darkGray.heading,
		size: getHeadingFontSize( level ),
		isBlock: true,
		weight: CONFIG.fontWeightHeading as import('react').CSSProperties[ 'fontWeight' ],
		...otherProps,
	} );

	return { ...textProps, ...a11yProps, as };
}
