import type { ReactNode } from 'react';
import type { ComponentProps } from '../utils/types';
import type { IconProps } from '../icon/types';
import type { ButtonProps } from '../button/types';
import type { IconButtonProps } from '../icon-button/types';
import type { LinkProps } from '../link/types';

export type NoticeIntent = 'warning' | 'success' | 'error' | 'info' | 'neutral';

export interface RootProps extends Omit< ComponentProps< 'div' >, 'title' > {
	/**
	 * The semantic intent of the notice, communicating its meaning through color.
	 * Available intents: neutral, info, warning, success, and error.
	 *
	 * @default 'neutral'
	 */
	intent?: NoticeIntent;

	/**
	 * Custom icon to override the default intent icon. Pass `null` to hide the icon.
	 * Default icons by intent: neutral (none), info (info), warning (caution),
	 * success (published), error (error).
	 */
	icon?: IconProps[ 'icon' ] | null;

	/**
	 * The content to be rendered inside the notice. Compose with `Title`,
	 * `Description`, `Actions`, and `CloseIcon`.
	 */
	children?: ReactNode;

	/**
	 * The message announced to screen readers via `speak()` from `@wordpress/a11y`.
	 *
	 * Defaults to the combined `Title` and `Description` text. Provide an
	 * explicit string when the announcement should differ from the visible copy.
	 */
	spokenMessage?: string;

	/**
	 * The politeness level for screen reader announcements.
	 * Defaults to 'assertive' for error intent, 'polite' for others.
	 */
	politeness?: 'polite' | 'assertive';
}

export interface TitleProps extends ComponentProps< 'span' > {
	/**
	 * The title text of the notice.
	 *
	 * For screen reader accessibility, this should only contain plain text,
	 * and no semantics such as links. Put links in `Notice.ActionLink`.
	 */
	children?: string;
}

export interface DescriptionProps extends ComponentProps< 'span' > {
	/**
	 * The description text of the notice.
	 *
	 * For screen reader accessibility, this should only contain plain text,
	 * and no semantics such as links. Put links in `Notice.ActionLink`.
	 */
	children?: string;
}

export interface ActionsProps extends ComponentProps< 'div' > {
	/**
	 * The action buttons for the notice.
	 */
	children?: ReactNode;
}

export interface CloseIconProps
	extends Omit<
		IconButtonProps,
		| 'loading'
		| 'loadingAnnouncement'
		| 'variant'
		| 'size'
		| 'tone'
		| 'label'
		| 'icon'
	> {
	/**
	 * A label describing the button's action, shown as a tooltip and to
	 * assistive technology.
	 */
	label?: IconButtonProps[ 'label' ];

	/**
	 * The icon to display in the button.
	 */
	icon?: IconButtonProps[ 'icon' ];
}

export interface ActionButtonProps
	extends Omit< ButtonProps, 'size' | 'tone' > {
	/**
	 * The content to be rendered inside the component.
	 */
	children?: ReactNode;
}

export interface ActionLinkProps extends Omit< LinkProps, 'variant' | 'tone' > {
	/**
	 * The content to be rendered inside the component.
	 */
	children?: ReactNode;
}
