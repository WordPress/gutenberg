import type { ReactElement, ReactNode } from 'react';
import type { Collapsible } from '@base-ui/react/collapsible';
import type { ComponentProps } from '../utils/types';

export type RootProps = Pick<
	Collapsible.Root.Props,
	'defaultOpen' | 'open' | 'onOpenChange' | 'disabled' | 'children'
>;

export interface TriggerProps extends ComponentProps< 'button' > {
	/**
	 * The content to be rendered inside the component.
	 */
	children: ReactElement;
}

export interface ContentProps
	extends ComponentProps< 'div' >,
		Pick< Collapsible.Panel.Props, 'hiddenUntilFound' | 'keepMounted' > {
	/**
	 * The content to be rendered inside the component.
	 */
	children?: ReactNode;
}
