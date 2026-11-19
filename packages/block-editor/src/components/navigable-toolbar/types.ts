import type { ReactNode, RefObject } from 'react';

/**
 * Props of `NavigableToolbar`. Other props are passed to the toolbar element.
 */
export interface NavigableToolbarProps {
	children?: ReactNode;
	/**
	 * Whether to focus the toolbar when it mounts. Deprecated.
	 */
	focusOnMount?: boolean;
	/**
	 * Whether Escape returns focus to the editor canvas.
	 */
	focusEditorOnEscape?: boolean;
	/**
	 * Whether the focus toolbar shortcut focuses the toolbar.
	 */
	shouldUseKeyboardFocusShortcut?: boolean;
	/**
	 * The index of the toolbar item to focus initially.
	 */
	__experimentalInitialIndex?: number;
	/**
	 * Called with the index of the focused item when the toolbar unmounts.
	 */
	__experimentalOnIndexChange?: ( index: number ) => void;
	orientation?: 'horizontal' | 'vertical';
	'aria-label': string;
	[ prop: string ]: unknown;
}

/**
 * Options of the hook that manages the toolbar focus.
 */
export interface ToolbarFocusOptions {
	toolbarRef: RefObject< HTMLElement | undefined >;
	focusOnMount?: boolean;
	isAccessibleToolbar: boolean;
	defaultIndex?: number;
	onIndexChange?: ( index: number ) => void;
	shouldUseKeyboardFocusShortcut: boolean;
	focusEditorOnEscape: boolean;
}
