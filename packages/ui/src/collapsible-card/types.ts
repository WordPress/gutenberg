import type { ReactNode } from 'react';
import type { PanelProps } from '../collapsible/types';
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

export interface HeaderDescriptionProps extends ComponentProps< 'div' > {
	/**
	 * Secondary content that describes the header trigger via
	 * `aria-describedby`. Rendered visually but marked `aria-hidden`
	 * so assistive technologies consume it only through the description
	 * relationship, avoiding double announcements.
	 *
	 * Avoid interactive elements — the entire header is the toggle trigger.
	 */
	children?: ReactNode;
}

export interface ContentProps extends ComponentProps< 'div' > {
	/**
	 * The content to be rendered inside the collapsible content area.
	 */
	children?: ReactNode;
	/**
	 * Allows the browser’s built-in page search to find and expand the panel contents.
	 *
	 * Overrides the `keepMounted` prop and uses `hidden="until-found"`
	 * to hide the element without removing it from the DOM.
	 *
	 * @default true
	 */
	hiddenUntilFound?: PanelProps[ 'hiddenUntilFound' ];
}
