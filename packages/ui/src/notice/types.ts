import type { ReactNode } from 'react';
import type { ComponentProps } from '../utils/types';
import type { IconProps } from '../icon/types';
import type { ButtonProps } from '../button/types';
import type { IconButtonProps } from '../icon-button/types';

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
	 * The content to be rendered inside the notice.
	 */
	children?: ReactNode;

	/**
	 * The message to be announced to screen readers. Defaults to the children content.
	 * Used by the `speak()` function from `@wordpress/a11y`.
	 */
	spokenMessage?: ReactNode;

	/**
	 * The politeness level for screen reader announcements.
	 * Defaults to 'assertive' for error intent, 'polite' for others.
	 */
	politeness?: 'polite' | 'assertive';
}

export interface TitleProps extends ComponentProps< 'span' > {
	/**
	 * The title text of the notice.
	 */
	children?: ReactNode;
}

export interface DescriptionProps extends ComponentProps< 'div' > {
	/**
	 * The description text of the notice.
	 */
	children?: ReactNode;
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

export interface ActionLinkProps extends ComponentProps< 'a' > {
	/**
	 * The content to be rendered inside the component.
	 */
	children?: ReactNode;
}
