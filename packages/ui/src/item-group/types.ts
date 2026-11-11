import type { HTMLAttributes, MouseEventHandler, ReactNode } from 'react';
import type { ComponentProps } from '../utils/types';

/**
 * An item renders as an anchor, a button or a plain element depending on how
 * it is configured, so its passthrough props are typed against the common
 * `HTMLElement` rather than any one of them.
 */
type ItemElementProps = Omit<
	HTMLAttributes< HTMLElement >,
	| 'title'
	| 'onClick'
	| 'className'
	| 'style'
	| 'children'
	| 'dangerouslySetInnerHTML'
> &
	Pick< ComponentProps< 'div' >, 'className' | 'style' | 'render' >;

/**
 * How much vertical space each item takes.
 *
 * - `comfortable`: full-width rows on a settings screen.
 * - `compact`: rows in a narrow context such as the block inspector.
 */
export type Density = 'comfortable' | 'compact';

/**
 * How the items are grouped on screen.
 *
 * - `grouped`: one surface, with a dividing line between items.
 * - `separated`: each item is its own surface, with space between them.
 */
export type Variant = 'grouped' | 'separated';

/**
 * What activating an item does, which chooses its trailing glyph.
 *
 * - `drilldown`: opens a nested screen, shown with a chevron.
 * - `none`: no trailing glyph.
 */
export type Navigation = 'drilldown' | 'none';

export interface RootProps extends ComponentProps< 'ul' > {
	/**
	 * The `ItemGroup.Item` elements to list.
	 */
	children?: ReactNode;

	/**
	 * How much vertical space each item takes.
	 *
	 * @default "comfortable"
	 */
	density?: Density;

	/**
	 * How the items are grouped on screen.
	 *
	 * @default "grouped"
	 */
	variant?: Variant;

	/**
	 * Whether the group draws its own border, radius and background.
	 *
	 * Set this to `false` when the group sits inside a surface that already
	 * provides them, such as a `Card`. Ignored when `variant` is
	 * `separated`, where each item draws its own surface.
	 *
	 * @default true
	 */
	bordered?: boolean;
}

export interface ItemProps extends ItemElementProps {
	/**
	 * The name of the thing the item represents. For an item that navigates,
	 * this alone is the accessible name of the link, so it should match the
	 * heading of the screen it opens.
	 */
	title: ReactNode;

	/**
	 * Supporting text about the item. Announced as a description rather than
	 * as part of the name.
	 */
	description?: ReactNode;

	/**
	 * A leading icon, thumbnail or other visual. Hidden from assistive
	 * technology, so it must not carry meaning absent from the title or
	 * description.
	 */
	decoration?: ReactNode;

	/**
	 * Status shown alongside the title, usually one or more `Badge`
	 * components. Announced as a description, so it does not become part of
	 * the item's name.
	 */
	badges?: ReactNode;

	/**
	 * Controls belonging to the item, such as a `Button`. They render after
	 * the item's own content and remain separate activation targets, so an
	 * item can both navigate and offer a control of its own.
	 *
	 * Each control is described by the item's title and description, so a
	 * short label such as "Export" resolves to "Export, Export settings".
	 */
	actions?: ReactNode;

	/**
	 * What activating the item does, which chooses its trailing glyph. Only
	 * used when the item itself is activatable, through `href` or `onClick`.
	 *
	 * @default "drilldown"
	 */
	navigation?: Navigation;

	/**
	 * Makes the whole item a link to this destination.
	 */
	href?: string;

	/**
	 * The anchor `target` attribute, used when `href` is given.
	 */
	target?: string;

	/**
	 * The anchor `rel` attribute, used when `href` is given.
	 */
	rel?: string;

	/**
	 * Makes the whole item a button. Ignored when `href` is given.
	 */
	onClick?: MouseEventHandler;
}
