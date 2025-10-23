/**
 * WordPress dependencies
 */
import { createSlotFill } from '@wordpress/components';
import { Platform } from '@wordpress/element';

/**
 * Props to @fabiankaegy for the SlotFill implementation https://github.com/WordPress/gutenberg/pull/63689#issuecomment-2268555989
 * and to @mamaduka for the Symbol SlotFill key scoping solution https://github.com/WordPress/gutenberg/pull/69789#issuecomment-2775439902
 */
const { Fill, Slot } = createSlotFill(
	Platform.OS === 'web' ? Symbol( 'TabsList' ) : 'TabsList'
);

export const TabFill = ( { children, tabsClientId } ) => {
	return <Fill name={ `TabsList-${ tabsClientId }` }>{ children }</Fill>;
};

export const TabsListSlot = ( { tabsClientId } ) => {
	return (
		<Slot
			name={ `TabsList-${ tabsClientId }` }
			bubblesVirtually
			as="div"
			role="tablist"
			className="tabs__list"
		/>
	);
};
