import type { ReactNode } from 'react';
import type { ComponentProps } from '../utils/types';

export interface RootProps extends ComponentProps< 'div' > {
	/**
	 * The content to be rendered inside the collapsible card.
	 * Should include `CollapsibleCard.Header` and `CollapsibleCard.Content`.
	 */
	children?: ReactNode;
	/**
	 * Whether the collapsible panel is currently open (controlled).
	 *
	 * To render an uncontrolled collapsible card, use `defaultOpen` instead.
	 */
	open?: boolean;
	/**
	 * Whether the collapsible panel is initially open (uncontrolled).
	 * @default false
	 */
	defaultOpen?: boolean;
	/**
	 * Event handler called when the panel is opened or closed.
	 */
	onOpenChange?: ( open: boolean ) => void;
	/**
	 * Whether the component should ignore user interaction.
	 * @default false
	 */
	disabled?: boolean;
}

export interface HeaderProps extends ComponentProps< 'div' > {
	/**
	 * The content to be rendered inside the header.
	 */
	children?: ReactNode;
}

export interface ContentProps extends ComponentProps< 'div' > {
	/**
	 * The content to be rendered inside the collapsible content area.
	 */
	children?: ReactNode;
}
