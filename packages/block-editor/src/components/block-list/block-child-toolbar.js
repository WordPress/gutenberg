/**
 * WordPress dependencies
 */
import { createSlotFill } from '@wordpress/components';

const { Fill, Slot } = createSlotFill( 'ChildToolbar' );

export const ChildToolbar = ( { children } ) => (
	<Fill>
		{ children }
	</Fill>
);

// `bubblesVirtually` is required in order to avoid
// events triggered on the child toolbar from bubbling
// up to the parent Block.
export const ChildToolbarSlot = () => (
	<Slot bubblesVirtually={ true } />
);
