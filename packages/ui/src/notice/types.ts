import type { ReactNode } from 'react';
import type { ComponentProps } from '../utils/types';
import type { IconProps } from '../icon/types';

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

export interface DescriptionProps extends ComponentProps< 'span' > {
	/**
	 * The description text of the notice.
	 */
	children?: ReactNode;
}
