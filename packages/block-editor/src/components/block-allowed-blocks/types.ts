import type { BlockType } from '@wordpress/blocks';

export interface BlockAllowedBlocksControlProps {
	/** Client ID of the container block. */
	clientId: string;
}

export interface BlockAllowedBlocksModalProps {
	/** Client ID of the container block. */
	clientId: string;
	/** Block types the container can allow. */
	blockTypes: BlockType[];
	/** Block types the container currently allows. */
	selectedBlockTypes: BlockType[];
	/** Called when the modal closes. */
	onClose: () => void;
}
