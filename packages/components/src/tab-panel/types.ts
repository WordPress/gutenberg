/**
 * External dependencies
 */
import type { ReactNode } from 'react';

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
} & Record< any, any >;

export type TabButtonProps = {
	children: ReactNode;
	className?: string;
	onClick: ( event: MouseEvent ) => void;
	selected: boolean;
	tabId: string;
};

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
};
