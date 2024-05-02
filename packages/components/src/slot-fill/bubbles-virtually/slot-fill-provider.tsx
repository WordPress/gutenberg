/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';
import isShallowEqual from '@wordpress/is-shallow-equal';
import { observableMap } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import SlotFillContext from './slot-fill-context';
import type {
	SlotFillProviderProps,
	SlotFillBubblesVirtuallyContext,
} from '../types';

function createSlotRegistry(): SlotFillBubblesVirtuallyContext {
	const slots: SlotFillBubblesVirtuallyContext[ 'slots' ] = observableMap();
	const fills: SlotFillBubblesVirtuallyContext[ 'fills' ] = observableMap();

	const registerSlot: SlotFillBubblesVirtuallyContext[ 'registerSlot' ] = (
		name,
		ref,
		fillProps
	) => {
		const slot = slots.get( name );

		slots.set( name, {
			...slot,
			ref: ref || slot?.ref,
			fillProps: fillProps || slot?.fillProps || {},
		} );
	};

	const unregisterSlot: SlotFillBubblesVirtuallyContext[ 'unregisterSlot' ] =
		( name, ref ) => {
			// Make sure we're not unregistering a slot registered by another element
			// See https://github.com/WordPress/gutenberg/pull/19242#issuecomment-590295412
			if ( slots.get( name )?.ref === ref ) {
				slots.delete( name );
			}
		};

	const updateSlot: SlotFillBubblesVirtuallyContext[ 'updateSlot' ] = (
		name,
		fillProps
	) => {
		const slot = slots.get( name );
		if ( ! slot ) {
			return;
		}

		if ( isShallowEqual( slot.fillProps, fillProps ) ) {
			return;
		}

		slot.fillProps = fillProps;
		const slotFills = fills.get( name );
		if ( slotFills ) {
			// Force update fills.
			slotFills.forEach( ( fill ) => fill.current.rerender() );
		}
	};

	const registerFill: SlotFillBubblesVirtuallyContext[ 'registerFill' ] = (
		name,
		ref
	) => {
		fills.set( name, [ ...( fills.get( name ) || [] ), ref ] );
	};

	const unregisterFill: SlotFillBubblesVirtuallyContext[ 'registerFill' ] = (
		name,
		ref
	) => {
		const fillsForName = fills.get( name );
		if ( ! fillsForName ) {
			return;
		}

		fills.set(
			name,
			fillsForName.filter( ( fillRef ) => fillRef !== ref )
		);
	};

	return {
		slots,
		fills,
		registerSlot,
		updateSlot,
		unregisterSlot,
		registerFill,
		unregisterFill,
	};
}

export default function SlotFillProvider( {
	children,
}: SlotFillProviderProps ) {
	const registry = useMemo( createSlotRegistry, [] );
	return (
		<SlotFillContext.Provider value={ registry }>
			{ children }
		</SlotFillContext.Provider>
	);
}
