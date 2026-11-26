import type { ReactNode } from 'react';
import type { ButtonProps } from '../button/types';
import type { ComponentProps } from '../utils/types';

/**
 * How much space each row takes.
 *
 * - `comfortable`: full-width rows on a settings screen.
 * - `compact`: rows in a narrow context such as the block inspector.
 */
export type Density = 'comfortable' | 'compact';

/**
 * How the rows of a group relate to each other visually.
 *
 * - `joined`: one frame, with a dividing line between rows.
 * - `detached`: each row in its own frame, with a gap between rows.
 */
export type GroupVariant = 'joined' | 'detached';

export interface GroupProps extends ComponentProps< 'ul' > {
	/**
	 * Any mix of `Item.LinkRow`, `Item.ButtonRow` and `Item.ContentRow`.
	 */
	children?: ReactNode;

	/**
	 * How the rows relate to each other visually. Both variants are one list
	 * with the same semantics.
	 *
	 * - `joined`: one frame, with a dividing line between rows. Use it for
	 *   uniform rows that users scan as a set.
	 * - `detached`: each row in its own frame, with a gap between rows. Use it
	 *   when each row is a self-contained object.
	 *
	 * @default "joined"
	 */
	variant?: GroupVariant;

	/**
	 * How much space each row takes.
	 *
	 * @default "comfortable"
	 */
	density?: Density;
}

interface StandaloneRowProps {
	/**
	 * How much space a row outside an `Item.Group` takes. It has no effect
	 * inside an `Item.Group`, which sets the density of its rows.
	 *
	 * @default "comfortable"
	 */
	density?: Density;
}

export interface LinkRowProps
	extends
		Omit< ComponentProps< 'a' >, 'children' | 'target' >,
		StandaloneRowProps {
	/**
	 * Where to open the linked document. `"_blank"` also adds the accessible
	 * new-tab notice, and makes `Item.Chevron` show the new-tab arrow.
	 *
	 * When both `target` and `openInNewTab` are set, `target` determines the
	 * browsing context.
	 */
	target?: ComponentProps< 'a' >[ 'target' ];

	/**
	 * Adds an accessible notice for opening in a new tab, and makes
	 * `Item.Chevron` show the new-tab arrow. Defaults `target` to `"_blank"`
	 * when no explicit target is set.
	 *
	 * The arrow shows only when the row has an `Item.Chevron`, which a row
	 * with `Item.Actions` does not have.
	 *
	 * @default false
	 */
	openInNewTab?: boolean;

	/**
	 * The parts of the row. `Item.Label` is required: it names the link.
	 */
	children?: ReactNode;
}

export interface ButtonRowProps
	extends
		Omit<
			ButtonProps,
			| 'children'
			| 'variant'
			| 'tone'
			| 'size'
			| 'loading'
			| 'loadingAnnouncement'
		>,
		StandaloneRowProps {
	/**
	 * The parts of the row. `Item.Label` is required: it names the button.
	 */
	children?: ReactNode;
}

export interface ContentRowProps
	extends ComponentProps< 'div' >, StandaloneRowProps {
	/**
	 * The parts of the row, including the controls in `Item.Actions`.
	 */
	children?: ReactNode;
}

export interface MediaProps extends ComponentProps< 'span' > {
	/**
	 * A leading icon, thumbnail or swatch. Hidden from assistive
	 * technology, so it must not carry meaning absent from the label or the
	 * description, and must not hold a control, such as a drag handle.
	 */
	children?: ReactNode;
}

export interface LabelProps extends ComponentProps< 'span' > {
	/**
	 * The name of the thing the row represents. In `Item.LinkRow` and
	 * `Item.ButtonRow` this is the accessible name of the row's control, so
	 * it must be text and must not contain interactive elements.
	 *
	 * In `Item.LinkRow` and `Item.ButtonRow` the row sets the `id` of this
	 * part, which its control references. The part itself is hidden from
	 * assistive technology there, so do not render it as a heading: put
	 * the heading outside the row.
	 */
	children?: ReactNode;
}

export interface DescriptionProps extends ComponentProps< 'span' > {
	/**
	 * Supporting text. In `Item.LinkRow` and `Item.ButtonRow` it is also the
	 * accessible description of the row's control, and the row sets the `id`
	 * of this part.
	 *
	 * Use one `Item.Description` per row.
	 */
	children?: ReactNode;
}

export interface MetaProps extends ComponentProps< 'span' > {
	/**
	 * Trailing status or detail, such as a `Badge` or a current value. In
	 * `Item.LinkRow` and `Item.ButtonRow` it is also part of the accessible
	 * description of the row's control, and the row sets the `id` of this
	 * part.
	 *
	 * Keep it static. Interactive elements belong in `Item.Actions`. Use one
	 * `Item.Meta` per row, and put several values inside it.
	 */
	children?: ReactNode;
}

export interface ActionsProps extends ComponentProps< 'span' > {
	/**
	 * The controls of the row, each with its own activation target.
	 *
	 * Give each control a name that includes the row it acts on, such as
	 * "Reset background color", because the row does not add that context.
	 */
	children?: ReactNode;
}

export type ChevronProps = Omit<
	ComponentProps< 'svg' >,
	'children' | 'render' | 'width' | 'height'
>;
