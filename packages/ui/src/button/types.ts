import { type ReactNode, type HTMLAttributes } from 'react';
import type { Button as _Button } from '@base-ui/react/button';
import type { ComponentProps } from '../utils/types';

type _ButtonProps = ComponentProps< typeof _Button >;

export interface ButtonProps
	extends Omit< _ButtonProps, 'disabled' | 'aria-pressed' > {
	/**
	 * The variant of the button. Variants describe the visual style treatment
	 * of the button.
	 *
	 * @default "solid"
	 */
	variant?: 'solid' | 'outline' | 'minimal' | 'unstyled';

	/**
	 * The tone of the button, describing a semantic color intent:
	 *
	 * - `'brand': for the most prominent actions, using the brand colors.
	 * - `'neutral'` for less prominent actions.
	 *
	 * @default "brand"
	 */
	tone?: 'brand' | 'neutral';

	/**
	 * The size of the button.
	 *
	 * - `'default'`: For normal text-label buttons, unless it is a toggle button.
	 * - `'compact'`: For toggle buttons, icon buttons, and buttons when used in context of either.
	 * - `'small'`: For icon buttons associated with more advanced or auxiliary features.
	 *
	 * @default "default"
	 */
	size?: 'default' | 'compact' | 'small';

	/**
	 * Whether the button is disabled.
	 */
	disabled?: boolean;

	/**
	 * Whether the element should be focusable even when it is disabled.
	 *
	 * @default true
	 */
	focusableWhenDisabled?: _ButtonProps[ 'focusableWhenDisabled' ];

	/**
	 * Indicates the current "pressed" state of toggle buttons. This should only
	 * be used with neutral minimal buttons.
	 */
	'aria-pressed'?: HTMLAttributes< HTMLButtonElement >[ 'aria-pressed' ];

	/**
	 * The content of the button.
	 */
	children?: ReactNode;

	/**
	 * Whether the button is in a loading state, such as when an action is being
	 * performed.
	 * @default false
	 */
	loading?: boolean;

	/**
	 * The text used for assistive technology to indicate the loading state.
	 */
	loadingAnnouncement?: string;
}
