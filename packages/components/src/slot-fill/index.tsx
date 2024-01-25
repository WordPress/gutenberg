/**
 * External dependencies
 */
import type { ForwardedRef } from 'react';

/**
 * WordPress dependencies
 */
import { forwardRef, useContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import BaseFill from './fill';
import BaseSlot from './slot';
import BubblesVirtuallyFill from './bubbles-virtually/fill';
import BubblesVirtuallySlot from './bubbles-virtually/slot';
import BubblesVirtuallySlotFillProvider from './bubbles-virtually/slot-fill-provider';
import SlotFillProvider from './provider';
import SlotFillContext from './bubbles-virtually/slot-fill-context';
import type { WordPressComponentProps } from '../context';

export { default as useSlot } from './bubbles-virtually/use-slot';
export { default as useSlotFills } from './bubbles-virtually/use-slot-fills';
import type {
	DistributiveOmit,
	FillComponentProps,
	SlotComponentProps,
	SlotFillProviderProps,
	SlotKey,
} from './types';

export function Fill( props: FillComponentProps ) {
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

export function UnforwardedSlot(
	props: SlotComponentProps &
		Omit< WordPressComponentProps< {}, 'div' >, 'className' >,
	ref: ForwardedRef< any >
) {
	const { bubblesVirtually, ...restProps } = props;
	if ( bubblesVirtually ) {
		return <BubblesVirtuallySlot { ...restProps } ref={ ref } />;
	}
	return <BaseSlot { ...restProps } />;
}
export const Slot = forwardRef( UnforwardedSlot );

export function Provider( {
	children,
	passthrough = false,
}: SlotFillProviderProps ) {
	const parent = useContext( SlotFillContext );
	if ( ! parent.isDefault && passthrough ) {
		return <>{ children }</>;
	}
	return (
		<SlotFillProvider>
			<BubblesVirtuallySlotFillProvider>
				{ children }
			</BubblesVirtuallySlotFillProvider>
		</SlotFillProvider>
	);
}

export function createSlotFill( key: SlotKey ) {
	const baseName = typeof key === 'symbol' ? key.description : key;
	const FillComponent = ( props: Omit< FillComponentProps, 'name' > ) => (
		<Fill name={ key } { ...props } />
	);
	FillComponent.displayName = `${ baseName }Fill`;

	const SlotComponent = (
		props: DistributiveOmit< SlotComponentProps, 'name' >
	) => <Slot name={ key } { ...props } />;
	SlotComponent.displayName = `${ baseName }Slot`;
	SlotComponent.__unstableName = key;

	return {
		Fill: FillComponent,
		Slot: SlotComponent,
	};
}

export const createPrivateSlotFill = ( name: string ) => {
	const privateKey = Symbol( name );
	const privateSlotFill = createSlotFill( privateKey );

	return { privateKey, ...privateSlotFill };
};
