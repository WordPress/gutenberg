/**
 * WordPress dependencies
 */
import { createSlotFill } from '@wordpress/components';

const { Fill: MainDashboardButton, Slot, useSlot } = createSlotFill(
	'__experimentalMainDashboardButton'
);

const MainDashboardButtonSlot = ( { children } ) => {
	const slot = useSlot();
	const hasFills = Boolean( slot.fills && slot.fills.length );

	if ( ! hasFills ) {
		return children;
	}

	return <Slot bubblesVirtually />;
};

MainDashboardButton.Slot = MainDashboardButtonSlot;

export default MainDashboardButton;
