/**
 * Internal dependencies
 */
import BaseSlot from './slot';
import BaseFill from './fill';
import Provider from './context';
import BubblesVirtuallySlot from './bubbles-virtually/slot';
import BubblesVirtuallyFill from './bubbles-virtually/fill';
import useSlot from './bubbles-virtually/use-slot';

export function Slot( { bubblesVirtually, ...props } ) {
	if ( bubblesVirtually ) {
		return <BubblesVirtuallySlot { ...props } />;
	}
	return <BaseSlot { ...props } />;
}

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

export function createSlotFill( name ) {
	const FillComponent = ( props ) => <Fill name={ name } { ...props } />;
	FillComponent.displayName = name + 'Fill';

	const SlotComponent = ( props ) => <Slot name={ name } { ...props } />;
	SlotComponent.displayName = name + 'Slot';

	return {
		Fill: FillComponent,
		Slot: SlotComponent,
	};
}

export { useSlot, Provider };
