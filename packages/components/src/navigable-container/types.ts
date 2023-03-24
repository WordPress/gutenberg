/**
 * External depndencies
 */
import type { KeyboardEvent, ReactNode } from 'react';

type BaseProps = {
	/**
	 * The component children.
	 */
	children: ReactNode;
	/**
	 * A boolean which tells the component whether or not to cycle from the end back to the beginning and vice versa.
	 *
	 * @default true
	 */
	cycle: boolean;
	/**
	 * A callback invoked when the menu navigates to one of its children passing the index and child as an argument
	 */
	onNavigate: ( index: number, focusable: Element ) => void;
	/**
	 *
	 * The orientation of the menu. It could be "vertical", "horizontal" or "both"
	 * (NavigableMenu only)
	 *
	 * @default 'vertical'
	 */
	orientation: string;
}

export type MenuProps = BaseProps;

export type NavigableContainerProps = BaseProps & {
	/**
	 * Gets an offset, given an event.
	 */
	eventToOffset: ( event: KeyboardEvent< HTMLDivElement > ) => -1 | 1 | 0;
	/**
	 * Whether to only consider browser tab stops.
	 *
	 * @default false
	 */
	onlyBrowserTabstops: boolean;
};