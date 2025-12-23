import { type GapSize } from '@wordpress/theme';
import { type ComponentProps } from '../utils/types';

export interface StackProps extends ComponentProps< 'div' > {
	/**
	 * The direction of the stack.
	 */
	direction?: Exclude<
		React.CSSProperties[ 'flexDirection' ],
		'row-reverse' | 'column-reverse'
	>;

	/**
	 * The amount of space between each child element using design system tokens.
	 *
	 * @default undefined
	 */
	gap?: GapSize;

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
