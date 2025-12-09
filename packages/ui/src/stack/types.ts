/**
 * Internal dependencies
 */
import { type ComponentProps } from '../utils/types';

export type SizeToken = '2xs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface StackProps extends ComponentProps< 'div' > {
	/**
	 * The direction of the stack.
	 */
	direction?: Exclude<
		React.CSSProperties[ 'flexDirection' ],
		'row-reverse' | 'column-reverse'
	>;

	/**
	 * The amount of space between each child element. As a number, it is a
	 * multiple of the design system grid spacing.
	 *
	 * @default 'initial'
	 */
	gap?: number | SizeToken | React.CSSProperties[ 'gap' ];

	/**
	 * The alignment of the stack items along the cross axis.
	 *
	 * @default 'initial'
	 */
	align?: React.CSSProperties[ 'alignItems' ];

	/**
	 * The alignment of the stack items along the main axis.
	 *
	 * @default 'initial'
	 */
	justify?: React.CSSProperties[ 'justifyContent' ];

	/**
	 * Whether the stack items should wrap to the next line.
	 */
	wrap?: Exclude< React.CSSProperties[ 'flexWrap' ], 'wrap-reverse' >;

	/**
	 * The content to be rendered inside the component.
	 */
	children?: React.ReactNode;
}
