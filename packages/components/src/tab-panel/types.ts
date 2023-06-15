/**
 * External dependencies
 */
import type { MouseEvent, ReactNode } from 'react';

/**
 * Internal dependencies
 */
import type { IconType } from '../icon';

type Tab = {
	/**
	 * The key of the tab.
	 */
	name: string;
	/**
	 * The label of the tab.
	 */
	title: string;
	/**
	 * The class name to apply to the tab button.
	 */
	className?: string;
	/**
	 * The icon used for the tab button.
	 */
	icon?: IconType;
	/**
	 * Determines if the tab button should be disabled.
	 */
	disabled?: boolean;
} & Record< any, any >;

export type TabButtonProps = {
	children: ReactNode;
	label?: string;
	onClick: ( event: MouseEvent ) => void;
	selected: boolean;
	showTooltip?: boolean;
	tabId: string;
} & Pick< Tab, 'className' | 'icon' | 'disabled' >;

export type TabPanelProps = {
	/**
	 * The class name to add to the active tab.
	 *
	 * @default 'is-active'
	 */
	activeClass?: string;
	/**
	 * A function which renders the tabviews given the selected tab.
	 * The function is passed the active tab object as an argument as defined by the tabs prop.
	 */
	children: ( tab: Tab ) => ReactNode;
	/**
	 * The class name to give to the outer container for the TabPanel.
	 */
	className?: string;
	/**
	 * The name of the tab to be selected upon mounting of component.
	 * If this prop is not set, the first tab will be selected by default.
	 */
	initialTabName?: string;
	/**
	 * The function called when a tab has been selected.
	 * It is passed the `tabName` as an argument.
	 */
	onSelect?: ( tabName: string ) => void;
	/**
	 * The orientation of the tablist.
	 *
	 * @default `horizontal`
	 */
	orientation?: 'horizontal' | 'vertical';
	/**
	 * Array of tab objects. Each tab object should contain at least a `name` and a `title`.
	 */
	tabs: Tab[];
	/**
	 * When `true`, the tab will be selected when receiving focus (automatic tab
	 * activation). When `false`, the tab will be selected only when clicked
	 * (manual tab activation). See the official W3C docs for more info.
	 * .
	 *
	 * @default true
	 *
	 * @see https://www.w3.org/WAI/ARIA/apg/patterns/tabpanel/
	 */
	selectOnMove?: boolean;
};
