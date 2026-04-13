import type { ReactNode } from 'react';
import type { ComponentProps } from '../utils/types';

export interface BreadcrumbDefinition {
	/**
	 * The content rendered for the breadcrumb item.
	 */
	label: ReactNode;

	/**
	 * The URL used when the item is rendered as a link.
	 */
	href?: string;

	/**
	 * Customizes the underlying rendered element.
	 */
	render?: ComponentProps< 'a' >['render'] | ComponentProps< 'span' >['render'];
}

export interface BreadcrumbProps extends Omit< ComponentProps< 'nav' >, 'children' > {
	/**
	 * An array of breadcrumb items to render.
	 *
	 * All items except the last must provide an `href` value.
	 */
	items?: BreadcrumbDefinition[];

	/**
	 * Custom breadcrumb content. Use with `Breadcrumb.List`, `Breadcrumb.Item`,
	 * and `Breadcrumb.Current` for compound composition.
	 */
	children?: ReactNode;
}

export interface BreadcrumbListProps extends ComponentProps< 'ol' > {
	/**
	 * The breadcrumb items.
	 */
	children?: ReactNode;
}

export interface BreadcrumbItemProps extends ComponentProps< 'a' > {
	/**
	 * The content rendered inside the breadcrumb link.
	 */
	children?: ReactNode;
}

export interface BreadcrumbCurrentProps extends ComponentProps< 'span' > {
	/**
	 * The content rendered for the current page.
	 */
	children?: ReactNode;
}
