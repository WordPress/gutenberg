import type { ReactNode, Ref } from 'react';

/**
 * A tab of `TabbedSidebar`.
 */
export interface TabbedSidebarTab {
	name: string;
	title: ReactNode;
	panel?: ReactNode;
	panelRef?: Ref< HTMLDivElement >;
}

/**
 * Props of `TabbedSidebar`.
 */
export interface TabbedSidebarProps {
	/**
	 * The ID of the tab to be selected by default when the component renders.
	 */
	defaultTabId?: string;
	/**
	 * Function called when the close button is clicked.
	 */
	onClose: () => void;
	/**
	 * Function called when a tab is selected. Receives the selected tab's ID.
	 */
	onSelect: ( tabId: string ) => void;
	/**
	 * The ID of the currently selected tab.
	 */
	selectedTab?: string;
	/**
	 * The tabs to render.
	 */
	tabs: TabbedSidebarTab[];
	/**
	 * Accessibility label for the close button.
	 */
	closeButtonLabel: string;
}
