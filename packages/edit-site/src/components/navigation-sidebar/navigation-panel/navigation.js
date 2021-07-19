/**
 * WordPress dependencies
 */
import {
	__experimentalUseSlot as useSlot,
	createSlotFill,
} from '@wordpress/components';

const slotName = '__experimentalEditSiteNavigation';

const { Fill, Slot: NavigationSlot } = createSlotFill( slotName );

const Navigation = Fill;

const Slot = ( { children } ) => {
	const slot = useSlot( slotName );
	const hasFills = Boolean( slot.fills && slot.fills.length );

	if ( ! hasFills ) {
		return children;
	}

	return <NavigationSlot bubblesVirtually />;
};

Navigation.Slot = Slot;

export default Navigation;
