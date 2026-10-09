import type { ComponentType, RefAttributes } from 'react';

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
 * Wraps a component, returning one that forwards its ref and props.
 */
export type WithGlobalEventsHOC = < TProps extends object >(
	Inner: ComponentType< TProps >
) => ComponentType< TProps & RefAttributes< unknown > >;
