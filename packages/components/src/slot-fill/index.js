/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import BaseFill from './fill';
import BaseSlot from './slot';
import BubblesVirtuallyFill from './bubbles-virtually/fill';
import BubblesVirtuallySlot from './bubbles-virtually/slot';
import BubblesVirtuallySlotFillProvider from './bubbles-virtually/slot-fill-provider';
import SlotFillProvider from './provider';
import useSlot from './bubbles-virtually/use-slot';

export function Fill( props ) {
	// We're adding both Fills here so they can register themselves before
	// their respective slot has been registered. Only the Fill that has a slot
	// will render. The other one will return null.
	return (
		<>
			<BaseFill { ...props } />
			<BubblesVirtuallyFill { ...props } />
		</>
	);
}
export const Slot = forwardRef( ( { bubblesVirtually, ...props }, ref ) => {
	if ( bubblesVirtually ) {
		return <BubblesVirtuallySlot { ...props } ref={ ref } />;
	}
	return <BaseSlot { ...props } />;
} );

export function Provider( { children, ...props } ) {
	return (
		<SlotFillProvider { ...props }>
			<BubblesVirtuallySlotFillProvider>
				{ children }
			</BubblesVirtuallySlotFillProvider>
		</SlotFillProvider>
	);
}

export function createSlotFill( name ) {
	const FillComponent = ( props ) => <Fill name={ name } { ...props } />;
	FillComponent.displayName = name + 'Fill';

	const SlotComponent = ( props ) => <Slot name={ name } { ...props } />;
	SlotComponent.displayName = name + 'Slot';
	SlotComponent.__unstableName = name;

	return {
		Fill: FillComponent,
		Slot: SlotComponent,
	};
}

export { useSlot };
