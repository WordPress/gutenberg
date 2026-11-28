import type { ReactNode } from 'react';
import type { BlockIconProps } from '../block-icon/types';

/**
 * Props of the button selecting the parent block, rendered only with a click
 * handler.
 */
export interface OptionalParentSelectButtonProps {
	children?: ReactNode;
	onClick?: () => void;
}

/**
 * Props of `BlockCard`.
 */
export interface BlockCardProps {
	/**
	 * The title of the block.
	 */
	title?: string;
	/**
	 * The icon of the block.
	 */
	icon?: BlockIconProps[ 'icon' ];
	/**
	 * The description of the block.
	 */
	description?: string;
	/**
	 * Deprecated: Object containing block type data.
	 */
	blockType?: {
		title?: string;
		icon?: BlockIconProps[ 'icon' ];
		description?: string;
	};
	/**
	 * Additional classes to apply to the card.
	 */
	className?: string;
	/**
	 * Custom block name to display before the title.
	 */
	name?: string;
	/**
	 * Show a back arrow to the parent block in some situations.
	 */
	allowParentNavigation?: boolean;
	/**
	 * The parent clientId, if this card is for a parent block.
	 */
	parentClientId?: string;
	/**
	 * Whether the block card is for a child block.
	 */
	isChild?: boolean;
	/**
	 * The client ID of the block.
	 */
	clientId?: string;
	/**
	 * Controls rendered beside the block title.
	 */
	controls?: ReactNode;
	children?: ReactNode;
}
