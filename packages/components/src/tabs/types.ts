/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import type * as Ariakit from '@ariakit/react';

/**
 * Internal dependencies
 */
import type { IconType } from '../icon';

export type TabsContextProps =
	| {
			/**
			 * The tabStore object returned by Ariakit's `useTabStore` hook.
			 */
			store: Ariakit.TabStore;
			/**
			 * The unique id string for this instance of the Tabs component.
			 */
			instanceId: string;
	  }
	| undefined;

export type TabsProps = {
	/**
	 * The children elements, which should be at least a
	 * `Tabs.Tablist` component and a series of `Tabs.TabPanel`
	 * components.
	 */
	children: React.ReactNode;
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
	/**
	 * The id of the tab to be selected upon mounting of component.
	 * If this prop is not set, the first tab will be selected by default.
	 * The id provided will be internally prefixed with the
	 * `TabsContextProps.instanceId`.
	 *
	 * Note: this prop will be overridden by the `selectedTabId` prop if it is
	 * provided. (Controlled Mode)
	 */
	initialTabId?: string;
	/**
	 * The function called when a tab has been selected.
	 * It is passed the `instanceId`-prefixed `tabId` as an argument.
	 */
	onSelect?:
		| ( ( selectedId: string | null | undefined ) => void )
		| undefined;
	/**
	 * The orientation of the tablist.
	 *
	 * @default `horizontal`
	 */
	orientation?: 'horizontal' | 'vertical';
	/**
	 * The Id of the tab to display. This id is prepended with the `Tabs`
	 * instanceId internally.
	 *
	 * This prop puts the component into controlled mode. A value of
	 * `null` will result in no tab being selected.
	 */
	selectedTabId?: string | null;
};

export type TabListProps = {
	/**
	 * The children elements, which should be a series of `Tabs.TabPanel` components.
	 */
	children?: React.ReactNode;
	/**
	 * The class name to apply to the tablist.
	 */
	className?: string;
	/**
	 * Custom CSS styles for the rendered tablist.
	 */
	style?: React.CSSProperties;
};

export type TabProps = {
	/**
	 * The id of the tab, which is prepended with the `Tabs` instanceId.
	 */
	id: string;
	/**
	 * The label for the tab.
	 */
	title: string;
	/**
	 * Custom CSS styles for the tab.
	 */
	style?: React.CSSProperties;
	/**
	 * The children elements, generally the text to display on the tab.
	 */
	children?: React.ReactNode;
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
	 *
	 * @default false
	 */
	disabled?: boolean;
};

export type TabPanelProps = {
	/**
	 * The children elements, generally the content to display on the tabpanel.
	 */
	children?: React.ReactNode;
	/**
	 * A unique identifier for the TabPanel, which is used to generate a unique `id` for the underlying element.
	 */
	id: string;
	/**
	 * The class name to apply to the tabpanel.
	 */
	className?: string;
	/**
	 * Custom CSS styles for the rendered `TabPanel` component.
	 */
	style?: React.CSSProperties;
};
