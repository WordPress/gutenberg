/**
 * WordPress dependencies
 */
import {
	__experimentalUseSlot as useSlot,
	createSlotFill,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import FullscreenModeClose from '../fullscreen-mode-close';

const name = '__experimentalSiteEditorMainDashboardButton';

const { Fill, Slot } = createSlotFill( name );

const MainDashboardButton = Fill;
MainDashboardButton.Slot = Slot;
MainDashboardButton.slotName = name;

export const CloseButton = () => {
	const slot = useSlot( MainDashboardButton.slotName );
	const hasFills = Boolean( slot.fills && slot.fills.length );

	if ( ! hasFills ) {
		return <FullscreenModeClose />;
	}

	return <MainDashboardButton.Slot bubblesVirtually />;
};

export default MainDashboardButton;
