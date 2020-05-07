/**
 * WordPress dependencies
 */
import { createSlotFill } from '@wordpress/components';

const name = '__experimentalSiteEditorMainDashboardButtonIcon';

const { Fill, Slot } = createSlotFill( name );

const MainDashboardButtonIcon = Fill;
MainDashboardButtonIcon.Slot = Slot;
MainDashboardButtonIcon.slotName = name;

export default MainDashboardButtonIcon;
