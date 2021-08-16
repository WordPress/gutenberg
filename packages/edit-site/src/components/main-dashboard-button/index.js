/**
 * WordPress dependencies
 */
import { createSlotFill } from '@wordpress/components';

const { Fill, Slot: MainDashboardButtonSlot, useSlot } = createSlotFill(
	'__experimentalMainDashboardButton'
);

const MainDashboardButton = Fill;

const Slot = ( { children } ) => {
	const slot = useSlot();
	const hasFills = Boolean( slot.fills && slot.fills.length );

	if ( ! hasFills ) {
		return children;
	}

	return <MainDashboardButtonSlot bubblesVirtually />;
};

MainDashboardButton.Slot = Slot;

export default MainDashboardButton;
