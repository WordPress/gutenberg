import type { ComponentProps, ReactElement, RefObject } from 'react';
import type { createSlotFill, DropdownMenu } from '@wordpress/components';

type SlotFill = ReturnType< typeof createSlotFill >;

/**
 * The last item fill of the block toolbar, which carries its slot as a
 * static.
 */
export type BlockToolbarLastItem = SlotFill[ 'Fill' ] & {
	Slot: SlotFill[ 'Slot' ];
};

/**
 * Style variant of the block toolbar.
 */
export type BlockToolbarVariant = 'unstyled' | 'toolbar';

export interface PrivateBlockToolbarProps {
	/** Show or hide the Drag Handle for drag and drop functionality. */
	hideDragHandle?: boolean;
	/** Focus the toolbar when mounted. */
	focusOnMount?: boolean;
	/** The initial index of the toolbar item to focus. */
	__experimentalInitialIndex?: number;
	/** Called when the index of the focused toolbar item changes. */
	__experimentalOnIndexChange?: ( index: number ) => void;
	/**
	 * Style variant of the toolbar, also passed to the Dropdowns rendered
	 * from Block Toolbar Buttons.
	 */
	variant?: BlockToolbarVariant;
	/**
	 * While no block is selected, show the default block's icon and the
	 * mover, disabled.
	 */
	showPlaceholder?: boolean;
}

export interface BlockToolbarProps {
	/** Show or hide the Drag Handle for drag and drop functionality. */
	hideDragHandle?: boolean;
	/**
	 * Style variant of the toolbar, also passed to the Dropdowns rendered
	 * from Block Toolbar Buttons.
	 */
	variant?: BlockToolbarVariant;
}

export interface UseShowHoveredOrFocusedGesturesOptions {
	/** Element reference. */
	ref: RefObject< HTMLElement | null >;
	/** Whether to highlight the parent block, instead of the selected one. */
	highlightParent?: boolean;
	/** Debounce timeout in milliseconds. */
	debounceTimeout?: number;
}

export interface UseDebouncedShowGesturesOptions extends UseShowHoveredOrFocusedGesturesOptions {
	/** Whether the component has current focus. */
	isFocused: boolean;
}

export interface BlockToolbarIconProps {
	/** Client IDs of the selected blocks. */
	clientIds: string[];
	/** Whether the selected block is synced. */
	isSynced?: boolean;
}

/**
 * How the block toolbar icon renders.
 */
export type BlockToolbarIconVariant =
	'default' | 'switcher' | 'styles-only' | 'pattern-overrides';

export interface BlockStylesDropdownProps {
	/** Client IDs of the selected blocks. */
	clientIds: string[];
	/** The icon of the toggle. */
	children?: ComponentProps< typeof DropdownMenu >[ 'icon' ];
	/** Label of the toggle. */
	label: string;
	/** Text of the toggle. */
	text?: string;
}

export interface PatternOverridesPopoverContentProps {
	/** The client IDs of selected blocks. */
	clientIds: string[];
	/** The display title of the block. */
	blockTitle: string;
}

export interface PatternOverridesDropdownProps extends PatternOverridesPopoverContentProps {
	/** The icon element to display. */
	icon: ReactElement;
	/** The label for the button. */
	label: string;
}

export interface ClientIdProps {
	/** Client ID of the selected block. */
	clientId: string;
}
