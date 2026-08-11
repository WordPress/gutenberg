import { type AnchorHTMLAttributes, type ElementType } from 'react';

export type NavigationLinkProps = Omit<
	AnchorHTMLAttributes< HTMLAnchorElement >,
	'href'
> &
	Required< Pick< AnchorHTMLAttributes< HTMLAnchorElement >, 'href' > >;

export interface NavigationItem {
	/**
	 * The label text for the navigation item.
	 */
	label: string;

	/**
	 * The URL the item links to.
	 */
	href: string;
}

export interface NavigationProps {
	/**
	 * The navigation items to display.
	 */
	items: readonly NavigationItem[];

	/**
	 * The `href` of the current item. The matching item is rendered with
	 * `aria-current="page"` and a distinct visual treatment.
	 */
	currentHref?: string;

	/**
	 * Accessible label for the navigation landmark. Give each navigation on a
	 * screen a unique label, and omit the word "navigation" since the landmark
	 * role already conveys it.
	 *
	 * @default 'Sections'
	 */
	ariaLabel?: string;

	/**
	 * Component rendered in place of the default `<a>` for each item.
	 *
	 * @default 'a'
	 */
	linkComponent?: ElementType< NavigationLinkProps >;

	/**
	 * Optional class name for the root element.
	 */
	className?: string;
}
