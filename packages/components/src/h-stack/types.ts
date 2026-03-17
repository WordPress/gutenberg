/**
 * External dependencies
 */
import type { CSSProperties } from 'react';

/**
 * Internal dependencies
 */
import type { FlexProps } from '../flex/types';

export type HStackAlignment =
	| 'bottom'
	| 'bottomLeft'
	| 'bottomRight'
	| 'center'
	| 'edge'
	| 'left'
	| 'right'
	| 'stretch'
	| 'top'
	| 'topLeft'
	| 'topRight';

export type AlignmentProps = {
	justify?: CSSProperties[ 'justifyContent' ];
	align?: CSSProperties[ 'alignItems' ];
};

export type Alignments = Record< HStackAlignment, AlignmentProps >;

export type Props = Omit< FlexProps, 'align' | 'gap' > & {
	/**
	 * Determines how the child elements are aligned.
	 *
	 * * `top`: Aligns content to the top.
	 * * `topLeft`: Aligns content to the top/left.
	 * * `topRight`: Aligns content to the top/right.
	 * * `left`: Aligns content to the left.
	 * * `center`: Aligns content to the center.
	 * * `right`: Aligns content to the right.
	 * * `bottom`: Aligns content to the bottom.
	 * * `bottomLeft`: Aligns content to the bottom/left.
	 * * `bottomRight`: Aligns content to the bottom/right.
	 * * `edge`: Justifies content to be evenly spread out up to the main axis edges of the container.
	 * * `stretch`: Stretches content to the cross axis edges of the container.
	 *
	 * @default 'edge'
	 */
	alignment?: HStackAlignment | CSSProperties[ 'alignItems' ];
	/**
	 * The amount of space between each child element. Spacing in between each child can be adjusted by using `spacing`.
	 * The value of `spacing` works as a multiplier to the library's grid system (base of `4px`).
	 *
	 * @default 2
	 */
	spacing?: CSSProperties[ 'width' ];
};
