// @ts-nocheck
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
export { default as useSlotFills } from './bubbles-virtually/use-slot-fills';

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

export function createSlotFill( key ) {
	const baseName = typeof key === 'symbol' ? key.description : key;
	const FillComponent = ( props ) => <Fill name={ key } { ...props } />;
	FillComponent.displayName = `${ baseName }Fill`;

	const SlotComponent = ( props ) => <Slot name={ key } { ...props } />;
	SlotComponent.displayName = `${ baseName }Slot`;
	SlotComponent.__unstableName = key;

	return {
		Fill: FillComponent,
		Slot: SlotComponent,
	};
}

export const createPrivateSlotFill = ( name ) => {
	const privateKey = Symbol( name );
	const privateSlotFill = createSlotFill( privateKey );

	return { privateKey, ...privateSlotFill };
};

export { useSlot };
