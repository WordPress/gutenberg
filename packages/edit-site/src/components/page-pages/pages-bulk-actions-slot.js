/**
 * WordPress dependencies
 */
import {
	__experimentalUseSlotFills as useSlotFills,
	createSlotFill,
} from '@wordpress/components';

const slotName = 'pages.list.bulkActions';

const { Fill, Slot: PagesListBulkActionsSlot } = createSlotFill( slotName );

const PagesListBulkActions = Fill;

const Slot = ( { children } ) => {
	const fills = useSlotFills( slotName );
	// TODO: pass the context to children or just let the consumers
	// just use `useDataTableContext`. Probably let the consumers..
	// const table = useDataTableContext();
	if ( ! fills?.length ) {
		return children;
	}
	return <PagesListBulkActionsSlot bubblesVirtually />;
};
PagesListBulkActions.Slot = Slot;

export default PagesListBulkActions;
