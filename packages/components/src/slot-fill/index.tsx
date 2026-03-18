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
import Fill from './fill';
import BaseSlot from './slot';
import BubblesVirtuallySlot from './bubbles-virtually/slot';
import SlotFillProvider from './provider';
import SlotFillContext from './context';
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

export { Fill };

export const Slot = forwardRef(
	(
		props: SlotComponentProps &
			Omit< WordPressComponentProps< {}, 'div' >, 'className' >,
		ref: ForwardedRef< any >
	) => {
		const { bubblesVirtually, ...restProps } = props;
		if ( bubblesVirtually ) {
			return <BubblesVirtuallySlot { ...restProps } ref={ ref } />;
		}
		return <BaseSlot { ...restProps } />;
	}
);
Slot.displayName = 'Slot';

export function Provider( {
	children,
	passthrough = false,
}: SlotFillProviderProps ) {
	const parent = useContext( SlotFillContext );
	if ( ! parent.isDefault && passthrough ) {
		return <>{ children }</>;
	}
	return <SlotFillProvider>{ children }</SlotFillProvider>;
}
Provider.displayName = 'SlotFillProvider';

export function createSlotFill( key: SlotKey ) {
	const baseName = typeof key === 'symbol' ? key.description : key;
	const FillComponent = ( props: Omit< FillComponentProps, 'name' > ) => (
		<Fill name={ key } { ...props } />
	);
	FillComponent.displayName = `${ baseName }Fill`;

	// Wrap SlotComponent with forwardRef to support ref forwarding
	const SlotComponent = forwardRef(
		(
			props: DistributiveOmit< SlotComponentProps, 'name' >,
			ref: ForwardedRef< any >
		) => <Slot name={ key } ref={ ref } { ...props } />
	) as React.ForwardRefExoticComponent<
		DistributiveOmit< SlotComponentProps, 'name' > &
			React.RefAttributes< any >
	> & {
		__unstableName: SlotKey;
	};
	SlotComponent.displayName = `${ baseName }Slot`;
	/**
	 * @deprecated 6.8.0
	 * Please use `slotFill.name` instead of `slotFill.Slot.__unstableName`.
	 */
	SlotComponent.__unstableName = key;

	return {
		name: key,
		Fill: FillComponent,
		Slot: SlotComponent,
	};
}
