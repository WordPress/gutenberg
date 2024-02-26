/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import type * as Ariakit from '@ariakit/react';

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
	defaultTabId?: string;
	/**
	 * The function called when a tab has been selected.
	 * It is passed the id of the newly selected tab as an argument.
	 */
	onSelect?: ( selectedId: string | null | undefined ) => void;

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
	 * If left `undefined`, the component assumes it is being used in
	 * uncontrolled mode. Consequently, any value different than `undefined`
	 * will set the component in `controlled` mode.
	 * When in controlled mode, the `null` value will result in no tab being selected.
	 */
	selectedTabId?: string | null;
};

export type TabListProps = {
	/**
	 * The children elements, which should be a series of `Tabs.TabPanel` components.
	 */
	children?: React.ReactNode;
};

export type TabProps = {
	/**
	 * The id of the tab, which is prepended with the `Tabs` instanceId.
	 * The value of this prop should match with the value of the `tabId` prop on
	 * the corresponding `Tabs.TabPanel` component.
	 */
	tabId: string;
	/**
	 * The children elements, generally the text to display on the tab.
	 */
	children?: React.ReactNode;
	/**
	 * Determines if the tab button should be disabled.
	 *
	 * @default false
	 */
	disabled?: boolean;
	/**
	 * The type of component to render the tab button as. If this prop is not
	 * provided, the tab button will be rendered as a `button` element.
	 */
	render?: React.ReactElement;
};

export type TabPanelProps = {
	/**
	 * The children elements, generally the content to display on the tabpanel.
	 */
	children?: React.ReactNode;
	/**
	 * A unique identifier for the tabpanel, which is used to generate an
	 * instanced id for the underlying element.
	 * The value of this prop should match with the value of the `tabId` prop on
	 * the corresponding `Tabs.Tab` component.
	 */
	tabId: string;
	/**
	 * Determines whether or not the tabpanel element should be focusable.
	 * If `false`, pressing the tab key will skip over the tabpanel, and instead
	 * focus on the first focusable element in the panel (if there is one).
	 *
	 * @default true
	 */
	focusable?: boolean;
};
