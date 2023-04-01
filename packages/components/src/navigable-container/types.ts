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
	children?: ReactNode;
	/**
	 * A boolean which tells the component whether or not to cycle from the end back to the beginning and vice versa.
	 *
	 * @default true
	 */
	cycle?: boolean;
	/**
	 * A callback invoked when the menu navigates to one of its children passing the index and child as an argument
	 */
	onNavigate?: ( index: number, focusable: HTMLElement ) => void;
	/**
	 * Handler for the keydown event.
	 */
	onKeyDown?: ( event: KeyboardEvent ) => void;
};

export type NavigableMenuProps = WordPressComponentProps<
	BaseProps & {
		/**
		 * The orientation of the menu. It could be 'vertical' or 'horizontal'.
		 * (NavigableMenu only)
		 *
		 * @default 'vertical'
		 */
		orientation?: 'vertical' | 'horizontal';
	},
	'div',
	false
>;

type UnforwardedNavigableContainerProps = BaseProps & {
	/**
	 * Gets an offset, given an event.
	 */
	eventToOffset: ( event: KeyboardEvent ) => -1 | 0 | 1 | undefined;
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
};

export type NavigableContainerProps = WordPressComponentProps<
	UnforwardedNavigableContainerProps & { forwardedRef?: ForwardedRef< any > },
	'div',
	false
>;
export type TabbableContainerProps = WordPressComponentProps<
	Omit<
		NavigableContainerProps,
		'onlyBrowserTabstops' | 'stopNavigationEvents'
	>,
	'div',
	false
>;
