/**
 * External dependencies
 */
import type * as Ariakit from '@ariakit/react';

/**
 * Internal dependencies
 */
import type { IconType } from '../icon';

type Tab = {
	/**
	 * The key of the tab. Also used in the id of the tab button and the
	 * corresponding tabpanel.
	 */
	id: string;
	/**
	 * The label of the tab.
	 */
	title: string;
	/**
	 * The content to be displayed in the tabpanel when this tab is selected.
	 */
	content: React.ReactNode;
	/**
	 * Optional props to be applied to the tab button.
	 */
	tab?: {
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
	};
	// TODO: evaluate if this is needed
	/**
	 * Optional props to be applied to the tabpanel.
	 */
} & Record< any, any >;

export type TabsContextProps =
	| {
			/**
			 * The tabStore object returned by Ariakit's `useTabStore` hook.
			 */
			store: Ariakit.TabStore;
			/**
			 * The class name to add to the active tab.
			 */
			activeClass: string;
			/**
			 * The unique id string for this instance of the Tabs component.
			 */
			instanceId: string;
	  }
	| undefined;

export type TabsProps =
	// Because providing a tabs array will automatically render all of the
	// subcomponents, we need to make sure that the children prop is not also
	// provided.
	(
		| {
				/**
				 * Array of tab objects. Each tab object should contain at least
				 * a `id`, a `title`, and a `content` value.
				 */
				tabs: Tab[];
				children?: never;
		  }
		| {
				tabs?: never;
				/**
				 * The children elements, which should be at least a
				 * `Tabs.Tablist` component and a series of `Tabs.TabPanel`
				 * components.
				 */
				children: React.ReactNode;
		  }
	 ) & {
		/**
		 * The class name to add to the active tab.
		 *
		 * @default 'is-active'
		 */
		activeClass?: string;
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
		 * `undefined` returns the component to uncontrolled mode. A value of
		 * `null` will result in no tab being selected.
		 */
		selectedTabId?: string | null;
	};

export type TabListProps = {
	/**
	 * The children elements
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
	id: Tab[ 'id' ];
	/**
	 * The label for the tab.
	 */
	title: Tab[ 'title' ];
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
	 * The children elements
	 */
	children?: React.ReactNode;
	/**
	 * The id of the TabPanel, which is combined with the `Tabs` instanceId and
	 * the suffix '-view'.
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
