/**
 * External dependencies
 */
import type { ForwardedRef, ReactNode } from 'react';

/**
 * Internal dependencies
 */
import type { WordPressComponentProps } from '../ui/context';

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
	cycle?: boolean;
	/**
	 * A callback invoked when the menu navigates to one of its children passing the index and child as an argument
	 */
	onNavigate?: ( index: number, focusable: Element ) => void;
}

export type MenuProps = BaseProps & {
	/**
	 * The orientation of the menu. It could be 'vertical' or 'horizontal'.
	 * (NavigableMenu only)
	 *
	 * @default 'vertical'
	 */
	orientation?: 'vertical' | 'horizontal';
};

type UnforwardedNavigableContainerProps = BaseProps & {
	/**
	 * Gets an offset, given an event.
	 */
	eventToOffset: ( event: KeyboardEvent ) => -1 | 1 | 0 | undefined;
	/**
	 * Whether to only consider browser tab stops.
	 *
	 * @default false
	 */
	onlyBrowserTabstops: boolean;
	/**
	 * Handler for the keydown event.
	 */
	onKeyDown: ( event: KeyboardEvent ) => void;
	/**
	 * Whether to stop navigation events.
	 *
	 * @default false
	 */
	stopNavigationEvents: boolean;
};

export type NavigableContainerProps = WordPressComponentProps< UnforwardedNavigableContainerProps & { forwardedRef?: ForwardedRef< any > }, 'div', false >;
export type TabbableContainerProps = Omit< NavigableContainerProps, 'onlyBrowserTabstops' | 'stopNavigationEvents' >;
