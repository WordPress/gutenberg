/**
 * WordPress dependencies
 */
import {
	__experimentalUseSlot as useSlot,
	createSlotFill,
} from '@wordpress/components';

const slotName = '__experimentalNavigationPanelMainBackButton';

const { Fill, Slot: NavigationPanelMainBackButtonSlot } = createSlotFill(
	slotName
);

const NavigationPanelMainBackButton = Fill;

const Slot = ( { children } ) => {
	const slot = useSlot( slotName );
	const hasFills = Boolean( slot.fills && slot.fills.length );

	if ( ! hasFills ) {
		return children;
	}

	return <NavigationPanelMainBackButtonSlot />;
};

NavigationPanelMainBackButton.Slot = Slot;

export default NavigationPanelMainBackButton;
