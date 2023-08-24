/**
 * External dependencies
 */
import { createContext } from 'preact';
import { useContext, useEffect, useRef } from 'preact/hooks';

const slotsContext = createContext();
const childrenMap = new Map();

export const Fill = ( { slot, children } ) => {
	const slots = useContext( slotsContext );

	// TODO: We are using a unique id to avoid storing the full vnode in the deep
	// signal because when Preact modifies it, it creates an infinite loop.
	// We can replace it with `shallow` once this deepsignal PR is merged: https://github.com/luisherranz/deepsignal/pull/38
	// eslint-disable-next-line no-restricted-syntax
	const id = useRef( Math.random() );

	useEffect( () => {
		if ( slot ) {
			slots[ slot ] = id.current;
			childrenMap.set( id.current, children );
			return () => {
				slots[ slot ] = null;
			};
		}
	}, [ slots, slot, children ] );

	return !! slot ? null : children;
};

export const SlotProvider = slotsContext.Provider;

export const Slot = ( { name, children } ) => {
	const slots = useContext( slotsContext );
	const id = slots[ name ];
	return childrenMap.get( id ) || children;
};
