import type { ComponentProps, ReactNode } from 'react';

export interface ItemShortcut {
	/**
	 * Platform-appropriate visible shortcut, for example `⌘S`.
	 */
	displayShortcut: string;

	/**
	 * Value applied to `aria-keyshortcuts`, for example `Meta+S`.
	 */
	ariaKeyShortcut: string;

	/**
	 * Human-readable shortcut description announced to assistive technology.
	 */
	description: string;
}

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
	shortcut?: ItemShortcut;

	/**
	 * Raw text or structured ItemLabel and ItemDescription children.
	 */
	children?: ReactNode;
}

export interface InternalItemLayoutProps extends ItemLayoutProps {
	/**
	 * Selection indicator supplied by checkbox and radio items.
	 */
	selectionIndicator?: ReactNode;

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

export interface ItemLabelProps extends ComponentProps< 'span' > {
	/**
	 * The primary label for an interactive item.
	 */
	children?: ReactNode;
}

export interface ItemDescriptionProps extends ComponentProps< 'span' > {
	/**
	 * Supplementary text displayed below an interactive item label.
	 */
	children?: ReactNode;
}

export type ItemChevronDirection = 'block-end' | 'inline-end';
