/**
 * External dependencies
 */
import type { CSSProperties } from 'react';

/**
 * Internal dependencies
 */
import type { HStackAlignment, Props as HStackProps } from '../h-stack/types';

export type VStackProps = Omit< HStackProps, 'alignment' | 'spacing' > & {
	/**
	 * Determines how the child elements are aligned.
	 *
	 * -   `top`: Aligns content to the top.
	 * -   `topLeft`: Aligns content to the top/left.
	 * -   `topRight`: Aligns content to the top/right.
	 * -   `left`: Aligns content to the left.
	 * -   `center`: Aligns content to the center.
	 * -   `right`: Aligns content to the right.
	 * -   `bottom`: Aligns content to the bottom.
	 * -   `bottomLeft`: Aligns content to the bottom/left.
	 * -   `bottomRight`: Aligns content to the bottom/right.
	 * -   `edge`: Justifies content to be evenly spread out up to the main axis edges of the container.
	 * -   `stretch`: Stretches content to the cross axis edges of the container.
	 *
	 * @default 'stretch'
	 */
	alignment?: HStackAlignment | CSSProperties[ 'alignItems' ];
	/**
	 * The amount of space between each child element. Spacing in between each
	 * child can be adjusted by using `spacing`. The value of `spacing` works as
	 * a multiplier to the library's grid system (base of `4px`).
	 */
	spacing?: CSSProperties[ 'width' ];
};
