import type {
	ComponentPropsWithoutRef,
	CSSProperties,
	ReactNode,
	RefObject,
} from 'react';
import type { Popover } from '@wordpress/components';

type PopoverProps = Omit<
	ComponentPropsWithoutRef< typeof Popover >,
	'children'
>;

/**
 * Props of `BlockPopover`.
 */
export interface BlockPopoverProps extends PopoverProps {
	/**
	 * The client ID of the block representing the top position of the popover.
	 */
	clientId: string;
	/**
	 * The client ID of the block representing the bottom position of the popover.
	 */
	bottomClientId?: string | null;
	/**
	 * Whether the block popover always shifts into the viewport or remains at
	 * its original position.
	 */
	shift?: boolean;
	/**
	 * The content rendered inside the popover.
	 */
	children?: ReactNode;
}

/**
 * Props shared by the private block popovers.
 */
export interface PrivateBlockPopoverSlotProps {
	/**
	 * The legacy popover slot to render in, rendering in place when unset.
	 */
	__unstablePopoverSlot?: string;
	/**
	 * The canvas content, scrolled when the pointer wheels over the popover.
	 */
	__unstableContentRef?: RefObject< HTMLElement | null >;
}

/**
 * Props of `PrivateBlockPopover`.
 */
export interface PrivateBlockPopoverProps
	extends BlockPopoverProps, PrivateBlockPopoverSlotProps {}

/**
 * Props of `BlockPopoverCover`.
 */
export interface BlockPopoverCoverProps extends PrivateBlockPopoverProps {
	/**
	 * Styles applied to the container covering the block.
	 */
	additionalStyles?: CSSProperties;
}

/**
 * Props of `BlockPopoverInbetween`.
 */
export interface BlockPopoverInbetweenProps
	extends PopoverProps, PrivateBlockPopoverSlotProps {
	/**
	 * The client ID of the block before the popover.
	 */
	previousClientId: string | null | undefined;
	/**
	 * The client ID of the block after the popover.
	 */
	nextClientId: string | null | undefined;
	children?: ReactNode;
	operation?: string;
	nearestSide?: string;
}
