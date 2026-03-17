/**
 * WordPress dependencies
 */
import {
	__experimentalUseSlotFills as useSlotFills,
	createSlotFill,
} from '@wordpress/components';

// Keeping an old name for backward compatibility.
const slotName = '__experimentalMainDashboardButton';

export const useHasBackButton = () => {
	const fills = useSlotFills( slotName );
	return Boolean( fills && fills.length );
};

const { Fill, Slot } = createSlotFill( slotName );

const BackButton = Fill;
const BackButtonSlot = () => {
	const fills = useSlotFills( slotName );

	return (
		<Slot
			bubblesVirtually
			fillProps={ { length: ! fills ? 0 : fills.length } }
		/>
	);
};
BackButton.Slot = BackButtonSlot;

export default BackButton;
