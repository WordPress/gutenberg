/**
 * WordPress dependencies
 */
import { createSlotFill } from '@wordpress/components';

const name = '__experimentalSiteEditorMainDashboardButton';

const { Fill, Slot } = createSlotFill( name );

const MainDashboardButton = Fill;
MainDashboardButton.Slot = Slot;
MainDashboardButton.slotName = name;

export default MainDashboardButton;
