import type { Component, ComponentType } from 'react';

/**
 * Props the wrapped component receives: its own, the state and `setState`.
 */
export type WithStateInnerProps< TState extends object > = TState & {
	setState: Component< object, TState >[ 'setState' ];
};

/**
 * Wraps a component that takes the state props and `setState`, returning a
 * component that only accepts its own props.
 */
export type WithStateHOC< TState extends object > = < TProps extends object >(
	Inner: ComponentType< TProps & WithStateInnerProps< TState > >
) => ComponentType< TProps >;
