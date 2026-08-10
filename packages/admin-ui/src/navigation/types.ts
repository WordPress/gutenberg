import { type AnchorHTMLAttributes, type ComponentType } from 'react';

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

export interface NavigationComponents {
	/**
	 * Component rendered in place of the default `<a>` for each item, e.g. a
	 * client-side router link. It receives standard anchor attributes
	 * (`href`, `aria-current`, `className`, `children`) and must forward
	 * them to the element it renders.
	 *
	 * @default 'a'
	 */
	link?: ComponentType< AnchorHTMLAttributes< HTMLAnchorElement > >;
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
	 * Overrides for the elements the navigation renders.
	 */
	components?: NavigationComponents;
}
