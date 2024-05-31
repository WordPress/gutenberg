/**
 * WordPress dependencies
 */
import {
	__experimentalUseSlotFills as useSlotFills,
	createSlotFill,
} from '@wordpress/components';

// Keeping an old name for backward compatibility.
const slotName = '__experimentalMainDashboardButton';

const { Fill, Slot } = createSlotFill( slotName );

const BackButton = Fill;
const BackButtonSlot = ( { children } ) => {
	const fills = useSlotFills( slotName );
	const hasFills = Boolean( fills && fills.length );

	if ( ! hasFills ) {
		return children;
	}

	return <Slot bubblesVirtually />;
};
BackButton.Slot = BackButtonSlot;

export default BackButton;
