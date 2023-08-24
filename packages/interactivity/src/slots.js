/**
 * External dependencies
 */
import { createContext } from 'preact';
import { useContext, useEffect } from 'preact/hooks';

const slotsContext = createContext();

export const SlotContent = ( { slot, children } ) => {
	const slots = useContext( slotsContext );

	useEffect( () => {
		slots[ slot ] = children;
		return () => {
			slots[ slot ] = null;
		};
	}, [ slots, slot, children ] );

	return !! slot ? null : children;
};

export const SlotProvider = slotsContext.Provider;

export const Slot = ( { name, children } ) => {
	const slots = useContext( slotsContext );
	return slots[ name ] || children;
};
