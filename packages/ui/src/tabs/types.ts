import type { ReactNode } from 'react';
import type { Tabs as _Tabs } from '@base-ui/react/tabs';
import type { ComponentProps } from '../utils/types';

export type TabRootProps = ComponentProps< typeof _Tabs.Root > & {
	/**
	 * The content to be rendered inside the component.
	 */
	children?: ReactNode;
};

export type TabListProps = ComponentProps< typeof _Tabs.List > & {
	/**
	 * The content to be rendered inside the component.
	 */
	children?: ReactNode;
	/**
	 * The visual variant of the tab list.
	 * @default "default"
	 */
	variant?: 'minimal' | 'default';
};

export type TabProps = ComponentProps< typeof _Tabs.Tab > & {
	/**
	 * The content to be rendered inside the component.
	 */
	children?: ReactNode;
};

export type TabPanelProps = ComponentProps< typeof _Tabs.Panel > & {
	/**
	 * The content to be rendered inside the component.
	 */
	children?: ReactNode;
};
