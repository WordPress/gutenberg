import type { ReactNode } from 'react';
import type { Tabs } from '@base-ui/react/tabs';
import type { ComponentProps } from '../utils/types';

export type TabRootProps = ComponentProps<
	typeof Tabs.Root,
	Tabs.Root.State
> & {
	/**
	 * The content to be rendered inside the component.
	 */
	children?: ReactNode;
};

export type TabListProps = ComponentProps<
	typeof Tabs.List,
	Tabs.List.State
> & {
	/**
	 * The content to be rendered inside the component.
	 */
	children?: ReactNode;
	/**
	 * The visual density of the tab list.
	 * @default "default"
	 */
	density?: 'compact' | 'default';
};

export type TabProps = ComponentProps< typeof Tabs.Tab, Tabs.Tab.State > & {
	/**
	 * The content to be rendered inside the component.
	 */
	children?: ReactNode;
};

export type TabPanelProps = ComponentProps<
	typeof Tabs.Panel,
	Tabs.Panel.State
> & {
	/**
	 * The content to be rendered inside the component.
	 */
	children?: ReactNode;
};
