/**
 * WordPress dependencies
 */
import {
	__experimentalUseSlot as useSlot,
	createSlotFill,
} from '@wordpress/components';

const slotName = '__experimentalMainDashboardButton';

const { Fill, Slot: MainDashboardButtonSlot } = createSlotFill( slotName );

const MainDashboardButton = Fill;

const Slot = ( { children } ) => {
	const slot = useSlot( slotName );
	const hasFills = Boolean( slot.fills && slot.fills.length );

	if ( ! hasFills ) {
		return children;
	}

	return <MainDashboardButtonSlot bubblesVirtually />;
};

MainDashboardButton.Slot = Slot;

export default MainDashboardButton;
