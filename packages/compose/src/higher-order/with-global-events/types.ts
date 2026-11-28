import type { Component, ComponentType, JSX, RefCallback } from 'react';

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
 * that forwards its props, keeping `defaultProps` optional, and a callback ref.
 */
export type WithGlobalEventsHOC = <
	C extends new ( props: never ) => Component< object >,
>(
	Inner: C
) => ComponentType<
	JSX.LibraryManagedAttributes< C, InstanceType< C >[ 'props' ] > & {
		ref?: RefCallback< InstanceType< C > > | null;
	}
>;
