import type { ReactNode } from 'react';
import type { Collapsible as _Collapsible } from '@base-ui/react/collapsible';
import type { ComponentProps } from '../utils/types';

export type RootProps = ComponentProps< typeof _Collapsible.Root > & {
	/**
	 * The content to be rendered inside the component.
	 */
	children?: ReactNode;
};

export type TriggerProps = ComponentProps< typeof _Collapsible.Trigger > & {
	/**
	 * The content to be rendered inside the component.
	 */
	children?: ReactNode;
};

export type PanelProps = ComponentProps< typeof _Collapsible.Panel > & {
	/**
	 * The content to be rendered inside the component.
	 */
	children?: ReactNode;
};
