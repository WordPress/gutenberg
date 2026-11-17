import type { ButtonHTMLAttributes, MouseEvent } from 'react';

/**
 * Direction the mover buttons move the blocks in.
 */
export type BlockMoverDirection = 'up' | 'down';

/**
 * Orientation of the block movers.
 */
export type BlockMoverOrientation = 'vertical' | 'horizontal';

export interface BlockMoverProps {
	/** The client IDs of the blocks to move. */
	clientIds: string[];
	/** If this property is true, the drag handle is hidden. */
	hideDragHandle?: boolean;
}

export interface BlockMoverButtonProps extends Omit<
	ButtonHTMLAttributes< HTMLButtonElement >,
	'onClick'
> {
	/** The client IDs of the blocks to move. */
	clientIds: string[];
	/** Orientation of the mover, defaulting to the block list one. */
	orientation?: BlockMoverOrientation;
	/** Called after the blocks move. */
	onClick?: ( event: MouseEvent< HTMLButtonElement > ) => void;
}
