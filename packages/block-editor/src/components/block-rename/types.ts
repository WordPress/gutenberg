export interface BlockRenameControlProps {
	/** Client ID of the block to rename. */
	clientId: string;
}

export interface BlockRenameModalProps {
	/** Client ID of the block to rename. */
	clientId: string;
	/** Called when the modal closes. */
	onClose: () => void;
}
