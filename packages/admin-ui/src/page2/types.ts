import type { ComponentProps } from 'react';
// eslint-disable-next-line @wordpress/use-recommended-components -- admin-ui is a bundled package that depends on @wordpress/ui
import type { Badge, Button, IconButton, LinkButtonProps } from '@wordpress/ui';
import type { NavigationConfig } from '../navigation/types';

export interface Page2Badge {
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

export interface Page2ActionBase {
	/**
	 * The label. Rendered as the visible button text, unless `iconOnly` is
	 * set (only supported for actions with `onClick`), in which case it
	 * becomes the accessible name and tooltip text instead.
	 */
	label: string;

	/**
	 * Icon shown before the label, or as the sole content when `iconOnly`
	 * is set.
	 */
	icon?: ComponentProps< typeof IconButton >[ 'icon' ];
}

export type Page2ClickAction = Page2ActionBase &
	Omit<
		ComponentProps< typeof Button >,
		'children' | 'variant' | 'tone' | 'size' | 'disabled' | 'onClick'
	> & {
		onClick: ( event: React.MouseEvent< HTMLElement > ) => void;
		disabled?: boolean;

		/**
		 * Render as an icon-only button, using `label` as the accessible
		 * name and tooltip. Not supported for actions with `href`.
		 *
		 * @default false
		 */
		iconOnly?: boolean;
	};

export type Page2LinkAction = Page2ActionBase &
	Omit<
		LinkButtonProps,
		'children' | 'variant' | 'tone' | 'size' | 'href'
	> & {
		href: string;
	};

/**
 * A single action. Actions with `onClick` render as `Button` (or
 * `IconButton`, when `iconOnly` is set); actions with `href` render as
 * `LinkButton`.
 */
export type Page2Action = Page2ClickAction | Page2LinkAction;

export interface Page2Actions {
	/**
	 * The single most prominent action. Rendered rightmost among the action
	 * buttons.
	 */
	primary?: Page2Action;

	/**
	 * Up to two secondary actions, shown to the left of the primary action.
	 * On narrow containers, secondary actions move into the overflow menu
	 * first.
	 */
	secondary?:
		| readonly [ Page2Action ]
		| readonly [ Page2Action, Page2Action ];

	/**
	 * Additional actions, shown inside an overflow menu to the right of the
	 * primary action.
	 */
	overflow?: readonly Page2Action[];
}

export interface Page2BreadcrumbItem {
	/**
	 * The label text for the breadcrumb item.
	 */
	label: string;

	/**
	 * The destination for the breadcrumb item.
	 * It is optional for the last item (the current page).
	 * All preceding items must provide an `href`.
	 */
	href?: string;
}

export interface Page2Props {
	/**
	 * The level of the page's heading tag.
	 *
	 * @default 1
	 */
	headingLevel?: 1 | 2;

	/**
	 * An array of items to display in the breadcrumb trail. The last item is
	 * considered the current item.
	 */
	breadcrumbs?: Page2BreadcrumbItem[];

	/**
	 * Badges displayed alongside the page title.
	 */
	badges?: Page2Badge[];

	/**
	 * Optional visual mark (icon, image, etc.) shown before the page title or breadcrumbs.
	 *
	 * The visual is rendered outside the page heading element and is treated as purely
	 * decorative in the accessibility tree (the wrapper uses `aria-hidden`). Do not pass
	 * interactive content (links, buttons, tooltips) or non-redundant text here.
	 *
	 * When passing an `<img>`, use `alt=""` if the image does not add meaning beyond what is
	 * already available in the visible title, breadcrumbs, or surrounding copy. Meaningful
	 * images should not rely on this slot for their accessible name.
	 */
	visual?: React.ReactNode;

	/**
	 * The page title.
	 */
	title?: string;

	/**
	 * A short description shown below the title.
	 */
	description?: string;

	children: React.ReactNode;
	className?: string;

	/**
	 * Section navigation shown in the page header: the list of links and the
	 * `href` of the current one.
	 */
	navigation?: NavigationConfig;

	/**
	 * Actions shown in the page header.
	 */
	actions?: Page2Actions;
}
