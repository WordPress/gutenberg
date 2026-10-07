import type { ReactNode, DOMAttributes } from 'react';
import type { ComponentProps } from '../utils/types';

export interface RootProps extends Omit< ComponentProps< 'nav' >, 'children' > {
	/**
	 * Ancestors of one kind, either `Breadcrumb.LinkItem` or
	 * `Breadcrumb.ButtonItem`, followed by exactly one `Breadcrumb.CurrentItem`.
	 */
	children: ReactNode;

	/**
	 * The semantics to use when there are no ancestors. Ancestors determine
	 * the variant when present. Navigation is the default for current-only trails.
	 */
	variant?: 'navigation' | 'selection';
}

export interface LinkItemProps extends Omit<
	ComponentProps< 'a' >,
	'aria-current' | 'children' | 'href' | 'target'
> {
	/**
	 * The complete browser-compatible destination for the ancestor page.
	 */
	href: string;

	/**
	 * Whether to open the link in a new browser tab.
	 * When true, sets `target="_blank"` and appends a visual arrow indicator.
	 *
	 * @default false
	 */
	openInNewTab?: boolean;

	/**
	 * The plain-text breadcrumb label.
	 */
	children: string;
}

export interface CurrentItemProps extends Omit<
	ComponentProps< 'span' >,
	'aria-current' | 'children' | 'tabIndex'
> {
	/**
	 * The plain-text label for the current item.
	 */
	children: string;
}

/** The rendered target is a button in the trail and a div in the overflow menu. */
export type ButtonItemElement = HTMLButtonElement | HTMLDivElement;

export interface ButtonItemProps
	extends
		Omit<
			ComponentProps< 'div' >,
			keyof DOMAttributes< HTMLDivElement > | 'aria-current'
		>,
		Omit< DOMAttributes< ButtonItemElement >, 'children' > {
	/** The plain-text label for an ancestor in the same hierarchy. */
	children: string;

	/** Whether ancestor activation is unavailable. */
	disabled?: boolean;
}
