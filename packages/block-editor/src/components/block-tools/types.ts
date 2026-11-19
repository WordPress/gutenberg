import type {
	HTMLAttributes,
	MutableRefObject,
	ReactNode,
	RefObject,
} from 'react';

/**
 * The ref holding the editor content, which the block tools popovers scroll
 * with.
 */
export type ContentRef = RefObject< HTMLElement | null >;

export interface BlockToolsProps extends Omit<
	HTMLAttributes< HTMLDivElement >,
	'onKeyDown'
> {
	/** The block content and style container. */
	children?: ReactNode;
	/** Ref holding the content scroll container. */
	__unstableContentRef?: ContentRef;
}

export interface BlockToolbarPopoverProps {
	clientId: string;
	isTyping?: boolean;
	__unstableContentRef?: ContentRef;
}

export interface EmptyBlockInserterProps {
	clientId: string;
	__unstableContentRef?: ContentRef;
}

export interface InsertionPointProps {
	__unstablePopoverSlot?: string;
	__unstableContentRef?: ContentRef;
}

export interface InbetweenInsertionPointPopoverProps extends InsertionPointProps {
	operation?: string;
	nearestSide?: string;
}

/**
 * Whether the in-between inserter is open.
 */
export type InsertionPointOpenRefValue = MutableRefObject< boolean >;

export interface ZoomOutModeInserterButtonProps {
	onClick?: () => void;
}

export interface UseBlockToolbarPopoverPropsOptions {
	/** The DOM element that represents the editor content or canvas. */
	contentElement?: HTMLElement | null;
	/** The clientId of the first selected block. */
	clientId: string;
}

/**
 * The popover props that position the block toolbar.
 */
export interface BlockToolbarPopoverPositionProps {
	placement: 'top-start';
	flip: boolean;
	shift: boolean;
}
