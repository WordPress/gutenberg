import type { BlockTypeIcon } from '@wordpress/blocks';
import type { BlockAttributes } from '../../store/types';

/**
 * The block attributes read for display.
 */
export interface BlockDisplayAttributes extends BlockAttributes {
	anchor?: string;
	style?: { position?: { type?: string } };
}

/**
 * Contains basic block's information for display reasons.
 */
export interface BlockDisplayInformation {
	/**
	 * True if is a reusable block or template part
	 */
	isSynced: boolean;
	/**
	 * Human-readable block type label.
	 */
	title: string;
	/**
	 * Block type icon.
	 */
	icon: BlockTypeIcon;
	/**
	 * A detailed block type description.
	 */
	description?: string;
	/**
	 * HTML anchor.
	 */
	anchor?: string;
	/**
	 * The position type label.
	 */
	positionLabel: string | null;
	/**
	 * The `style.position.type` attribute.
	 */
	positionType?: string;
	/**
	 * A custom, human readable name for the block.
	 */
	name?: string;
}
