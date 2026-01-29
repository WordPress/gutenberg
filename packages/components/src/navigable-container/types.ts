/**
 * External dependencies
 */
import type { ForwardedRef, ReactNode } from 'react';

/**
 * Internal dependencies
 */
import type { WordPressComponentProps } from '../context';

type BaseProps = {
	/**
	 * The component children.
	 */
	children?: ReactNode;
	/**
	 * A boolean which tells the component whether or not to cycle from the end back to the beginning and vice versa.
	 *
	 * @default true
	 */
	cycle?: boolean;
	/**
	 * A callback invoked on the keydown event.
	 */
	onKeyDown?: ( event: KeyboardEvent ) => void;
	/**
	 * A callback invoked when the menu navigates to one of its children passing the index and child as an argument
	 */
	onNavigate?: ( index: number, focusable: HTMLElement ) => void;
};

export type NavigableContainerProps = WordPressComponentProps<
	BaseProps & {
		/**
		 * Gets an offset, given an event.
		 */
		eventToOffset: ( event: KeyboardEvent ) => -1 | 0 | 1 | undefined;
		/**
		 * The forwarded ref.
		 */
		forwardedRef?: ForwardedRef< any >;
		/**
		 * Whether to only consider browser tab stops.
		 *
		 * @default false
		 */
		onlyBrowserTabstops: boolean;
		/**
		 * Whether to stop navigation events.
		 *
		 * @default false
		 */
		stopNavigationEvents: boolean;
	},
	'div',
	false
>;

export type NavigableMenuProps = WordPressComponentProps<
	BaseProps & {
		/**
		 * The orientation of the menu.
		 *
		 * @default 'vertical'
		 */
		orientation?: 'vertical' | 'horizontal' | 'both';
	},
	'div',
	false
>;

export type TabbableContainerProps = WordPressComponentProps<
	BaseProps & Partial< Pick< NavigableContainerProps, 'eventToOffset' > >,
	'div',
	false
>;
