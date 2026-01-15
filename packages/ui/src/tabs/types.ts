/**
 * External dependencies
 */
import type { Tabs } from '@base-ui/react/tabs';

export type TabRootProps = Omit< Tabs.Root.Props, 'className' > & {
	/**
	 * The CSS class to apply.
	 */
	className?: Tabs.Root.Props[ 'className' ];
};

export type TabListProps = Omit< Tabs.List.Props, 'className' > & {
	/**
	 * The CSS class to apply.
	 */
	className?: Tabs.List.Props[ 'className' ];
	/**
	 * The visual density of the tab list.
	 * @default "default"
	 */
	density?: 'compact' | 'default';
};

export type TabProps = Omit< Tabs.Tab.Props, 'className' > & {
	/**
	 * The CSS class to apply.
	 */
	className?: Tabs.Tab.Props[ 'className' ];
};

export type TabPanelProps = Omit< Tabs.Panel.Props, 'className' > & {
	/**
	 * The CSS class to apply.
	 */
	className?: Tabs.Panel.Props[ 'className' ];
	/**
	 * Whether the tab panel should be included in the tab order.
	 * @default true
	 */
	focusable?: boolean;
};
