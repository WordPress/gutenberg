import { type ReactNode, type HTMLAttributes } from 'react';
import { type ButtonProps as AriakitButtonProps } from '@ariakit/react';
import { type ComponentProps } from '../utils/types';

export interface ButtonProps
	extends Omit< ComponentProps< 'button' >, 'disabled' | 'aria-pressed' > {
	/**
	 * The variant of the button. Variants describe the visual style treatment
	 * of the button.
	 *
	 * @default "solid"
	 */
	variant?: 'solid' | 'outline' | 'minimal' | 'unstyled';

	/**
	 * The tone of the button. Tone describes a semantic color intent.
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
	accessibleWhenDisabled?: AriakitButtonProps[ 'accessibleWhenDisabled' ];

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
