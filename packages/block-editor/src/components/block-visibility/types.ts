import type { BlockVisibility } from './use-block-visibility';

/**
 * A block whose visibility metadata is read.
 */
export interface BlockWithVisibility {
	attributes?: {
		metadata?: {
			blockVisibility?: BlockVisibility | null;
			[ key: string ]: unknown;
		};
		[ key: string ]: unknown;
	};
}

/**
 * Props of a block visibility control acting on blocks.
 */
export interface BlockVisibilityClientIdsProps {
	/**
	 * The client IDs of the blocks.
	 */
	clientIds: string[];
}

/**
 * Props of `BlockVisibilityModal`.
 */
export interface BlockVisibilityModalProps extends BlockVisibilityClientIdsProps {
	/**
	 * Callback function invoked when the modal is closed.
	 */
	onClose: () => void;
}

/**
 * Props of `ViewportVisibilityInfo`.
 */
export interface ViewportVisibilityInfoProps {
	clientId?: string;
}
