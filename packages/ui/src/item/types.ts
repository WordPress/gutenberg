import type { HTMLAttributes, MouseEventHandler, ReactNode } from 'react';
import type { ComponentProps } from '../utils/types';

/**
 * How much vertical space each row takes.
 *
 * - `comfortable`: full-width rows on a settings screen.
 * - `compact`: rows in a narrow context such as the block inspector.
 */
export type Density = 'comfortable' | 'compact';

export interface GroupProps extends ComponentProps< 'ul' > {
	/**
	 * Any mix of `Item.Link`, `Item.Button` and `Item.Row`.
	 */
	children?: ReactNode;

	/**
	 * Whether the group draws the frame around its entries.
	 *
	 * Set this to `false` inside a `Card`, which supplies the frame itself,
	 * so the list can sit between a description and other content.
	 *
	 * @default true
	 */
	frame?: boolean;

	/**
	 * How much vertical space each row takes.
	 *
	 * @default "comfortable"
	 */
	density?: Density;
}

/**
 * A row renders as an anchor, a button or a plain element, so its
 * passthrough props are typed against the common `HTMLElement`.
 */
type RowElementProps = Omit<
	HTMLAttributes< HTMLElement >,
	'title' | 'onClick' | 'className' | 'style' | 'children'
> &
	Pick< ComponentProps< 'div' >, 'className' | 'style' | 'render' >;

export interface LinkRowProps extends RowElementProps {
	/**
	 * The row's parts.
	 */
	children?: ReactNode;
	/**
	 * Where activating the row takes you.
	 */
	href: string;
	target?: string;
	rel?: string;
	onClick?: MouseEventHandler;
}

export interface ButtonRowProps extends RowElementProps {
	/**
	 * The row's parts.
	 */
	children?: ReactNode;
	/**
	 * What activating the row runs.
	 */
	onClick: MouseEventHandler;
}

export interface ContentRowProps extends RowElementProps {
	/**
	 * The row's parts, including the controls in `Item.Actions`.
	 */
	children?: ReactNode;
}

export interface MediaProps extends ComponentProps< 'span' > {
	/**
	 * A leading icon, thumbnail or swatch. Hidden from assistive
	 * technology, so it must not carry meaning absent from the label or the
	 * description.
	 */
	children?: ReactNode;
}

export interface LabelProps extends ComponentProps< 'span' > {
	/**
	 * The name of the thing the row represents. For `Item.Link` and
	 * `Item.Button` this alone is the row's accessible name.
	 */
	children?: ReactNode;
}

export interface DescriptionProps extends ComponentProps< 'span' > {
	/**
	 * Supporting text, announced as a description rather than as part of the
	 * row's name.
	 */
	children?: ReactNode;
}

export interface MetaProps extends ComponentProps< 'span' > {
	/**
	 * Trailing status or detail, such as a `Badge`. Announced as a
	 * description. Keep it static: a control here would sit inside an
	 * `Item.Link` or `Item.Button`. Controls belong in `Item.Actions`.
	 */
	children?: ReactNode;
}

export interface ActionsProps extends ComponentProps< 'span' > {
	/**
	 * Controls belonging to the row, each its own activation target. Use
	 * them in an `Item.Row`, whose own surface is not activatable.
	 */
	children?: ReactNode;
}

export type ChevronProps = Omit< ComponentProps< 'svg' >, 'children' >;
