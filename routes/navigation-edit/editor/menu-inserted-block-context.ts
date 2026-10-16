import { createContext } from '@wordpress/element';

/**
 * Tracks the last item inserted from an item's options menu ("Add before" /
 * "Add after"). The link popover for a new item opens beside the row when the
 * item came from that menu, and under the row when the appender spawned it,
 * so the link UI needs to tell the two apart.
 */
export const MenuInsertedBlockContext = createContext< {
	/** Records the item just inserted from the options menu. */
	mark: ( clientId: string ) => void;
	/** Whether the item was the last one inserted from the options menu. */
	isMarked: ( clientId: string ) => boolean;
} >( {
	mark: () => {},
	isMarked: () => false,
} );
