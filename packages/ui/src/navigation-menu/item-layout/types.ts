import type { ReactNode } from 'react';
import type { Text } from '../../text';
import type { ComponentProps } from '../../utils/types';
import type { KeyboardShortcut } from '../../utils/keyboard-shortcut';

export interface ItemLayoutProps {
	/**
	 * Content rendered before the primary label.
	 */
	prefix?: ReactNode;

	/**
	 * Content rendered after the label and description.
	 */
	suffix?: ReactNode;

	/**
	 * Visible and accessible shortcut metadata.
	 *
	 * This does not install a keyboard event handler.
	 */
	shortcut?: KeyboardShortcut;

	/**
	 * Raw text or structured ItemLabel and ItemDescription children.
	 */
	children?: ReactNode;
}

export interface InternalItemLayoutProps extends ItemLayoutProps {
	/**
	 * Content appended inside the label, such as a new-tab indicator.
	 */
	labelTrailing?: ReactNode;

	/**
	 * Final directional affordance, such as a submenu chevron.
	 */
	trailing?: ReactNode;

	/**
	 * ID of an accessible shortcut description.
	 */
	shortcutDescriptionId?: string;
}

export interface ItemLabelProps extends Omit<
	ComponentProps< typeof Text >,
	'variant'
> {
	/**
	 * The primary label for an interactive item.
	 */
	children?: ReactNode;
}

export interface ItemDescriptionProps extends Omit<
	ComponentProps< typeof Text >,
	'variant'
> {
	/**
	 * Supplementary text displayed below an interactive item label.
	 */
	children?: ReactNode;
}

export type ItemChevronDirection = 'block-end' | 'inline-end';
