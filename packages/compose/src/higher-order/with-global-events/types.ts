import type { Component, ComponentType, RefCallback } from 'react';

/**
 * An instance that receives the window events it subscribed to.
 */
export type ListenerInstance = {
	handleEvent: ( event: Event ) => void;
};

/**
 * Props of the class component that subscribes to the events.
 */
export type WrapperProps = {
	ownProps: object;
	forwardedRef:
		( ( instance: Record< string, unknown > | null ) => void ) | null;
};

/**
 * A component whose instance the wrapper reads the handlers from.
 */
export type RefComponent = ComponentType< {
	ref?: ( instance: Record< string, unknown > | null ) => void;
} >;

/**
 * Wraps a class component, whose instance handles the events, returning one
 * that forwards its props and a callback ref, the only kind it supports.
 */
export type WithGlobalEventsHOC = <
	C extends new ( props: never ) => Component< object >,
>(
	Inner: C
) => ComponentType<
	ConstructorParameters< C >[ 0 ] & {
		ref?: RefCallback< InstanceType< C > >;
	}
>;
