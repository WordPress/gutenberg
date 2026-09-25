import { type ComponentProps, type ComponentType } from 'react';
import type { Badge } from '@wordpress/ui';
import type { NavigationLinkProps } from '../navigation/types';

export interface PageBadge {
	/**
	 * The text to display in the badge.
	 */
	label: string;

	/**
	 * The semantic intent of the badge, communicating its meaning through color.
	 *
	 * @default "none"
	 */
	intent?: ComponentProps< typeof Badge >[ 'intent' ];
}

export interface PageComponents {
	/**
	 * Component rendered in place of the default `<a>` for link-based UI in
	 * the page header (e.g. section navigation), such as a client-side router
	 * link. It receives standard anchor attributes (`href`, `aria-current`,
	 * `className`, `children`) and must forward them to the element it renders.
	 *
	 * @default 'a'
	 */
	link?: ComponentType< NavigationLinkProps >;
}
