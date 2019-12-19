/**
 * WordPress dependencies
 */
import {
	createContext,
	useMemo,
	useCallback,
	useState,
	useContext,
} from '@wordpress/element';

const SlotFillContext = createContext();

function useSlotRegistry() {
	const [ slots, setSlots ] = useState( {} );

	const register = useCallback( ( name, ref, fillProps = {} ) => {
		setSlots( ( prevSlots ) => ( {
			...prevSlots,
			[ name ]: {
				ref,
				fillProps,
			},
		} ) );
	}, [] );

	const update = useCallback( ( name, ref, fillProps ) => {
		setSlots( ( prevSlots ) => ( {
			...prevSlots,
			[ name ]: {
				ref: ref || prevSlots[ name ].ref,
				fillProps: fillProps || prevSlots[ name ].fillProps || {},
			},
		} ) );
	}, [] );

	const unregister = useCallback( ( name ) => {
		setSlots( ( prevSlots ) => {
			// eslint-disable-next-line no-unused-vars
			const { [ name ]: _, ...nextSlots } = prevSlots;
			return nextSlots;
		} );
	} );

	const registry = useMemo(
		() => ( {
			slots,
			register,
			update,
			unregister,
		} ),
		[ slots, register, update, unregister ]
	);

	return registry;
}

export function useSlot( name ) {
	const registry = useContext( SlotFillContext );

	const { ref, fillProps } = registry.slots[ name ] || {};

	const update = useCallback(
		( slotRef, slotFillProps ) => {
			registry.update( name, slotRef, slotFillProps );
		},
		[ registry.update ]
	);

	const unregister = useCallback( () => {
		registry.unregister( name );
	}, [ registry.unregister ] );

	if ( ! registry.slots[ name ] ) {
		return null;
	}

	return {
		ref,
		fillProps,
		update,
		unregister,
	};
}

export function useSlotFillContext() {
	return useContext( SlotFillContext );
}

export default function SlotFillProvider( { children } ) {
	const registry = useSlotRegistry();
	return (
		<SlotFillContext.Provider value={ registry }>
			{ children }
		</SlotFillContext.Provider>
	);
}
