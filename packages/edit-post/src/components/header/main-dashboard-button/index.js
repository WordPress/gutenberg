/**
 * WordPress dependencies
 */
import {
	__experimentalUseSlotFills as useSlotFills,
	createSlotFill,
} from '@wordpress/components';

const slotName = '__experimentalMainDashboardButton';

const { Fill, Slot: MainDashboardButtonSlot } = createSlotFill( slotName );

const MainDashboardButton = Fill;

const Slot = ( { children } ) => {
	const fills = useSlotFills( slotName );
	const hasFills = Boolean( fills && fills.length );

	if ( ! hasFills ) {
		return children;
	}

	return <MainDashboardButtonSlot bubblesVirtually />;
};

MainDashboardButton.Slot = Slot;

export default MainDashboardButton;
