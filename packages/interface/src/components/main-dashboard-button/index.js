/**
 * WordPress dependencies
 */
import {
	__experimentalUseSlot as useSlot,
	createSlotFill,
} from '@wordpress/components';

const name = '__experimentalMainDashboardButton';

const { Fill, Slot } = createSlotFill( name );

const MainDashboardButton = Fill;
MainDashboardButton.Slot = Slot;
MainDashboardButton.slotName = name;

export const CloseButtonSlot = ( { children } ) => {
	const slot = useSlot( MainDashboardButton.slotName );
	const hasFills = Boolean( slot.fills && slot.fills.length );

	if ( ! hasFills ) {
		return children;
	}

	return <MainDashboardButton.Slot bubblesVirtually />;
};

export default MainDashboardButton;
