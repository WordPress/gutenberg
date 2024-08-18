/**
 * External dependencies
 */
import type { SeparatorProps } from '@ariakit/react';

/**
 * Internal dependencies
 */
import type { SpaceInput } from '../utils/space';

export type DividerProps = Omit<
	SeparatorProps,
	'children' | 'unstable_system' | 'orientation' | 'as' | 'render'
> & {
	/**
	 * Adjusts all margins on the inline dimension.
	 *
	 * Can either be a number (which will act as a multiplier to the library's grid system base of 4px),
	 * or a literal CSS value string.
	 */
	margin?: SpaceInput;
	/**
	 * Adjusts the inline-end margin.
	 *
	 * Can either be a number (which will act as a multiplier to the library's grid system base of 4px),
	 * or a literal CSS value string.
	 */
	marginEnd?: SpaceInput;
	/**
	 * Adjusts the inline-start margin.
	 *
	 * Can either be a number (which will act as a multiplier to the library's grid system base of 4px),
	 * or a literal CSS value string.
	 */
	marginStart?: SpaceInput;
	/**
	 * Divider's orientation. When using inside a flex container, you may need
	 * to make sure the divider is `stretch` aligned in order for it to be
	 * visible.
	 *
	 * @default 'horizontal'
	 */
	orientation?: SeparatorProps[ 'orientation' ];
};
