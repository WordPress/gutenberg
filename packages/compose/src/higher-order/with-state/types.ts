import type { Component, ComponentClass, JSX } from 'react';
import type {
	WithInjectedProps,
	WithoutInjectedProps,
} from '../../utils/create-higher-order-component';

/**
 * Props the wrapped component receives: its own, the state and `setState`.
 */
export type WithStateInnerProps<
	TState extends object,
	TOwnProps extends object = object,
> = TState & {
	setState: Component< TOwnProps, TState >[ 'setState' ];
};

/**
 * Wraps a component taking the state and `setState`, returning a class whose
 * props are the remaining own props, with the defaulted ones optional.
 */
export type WithStateHOC< TState extends object > = <
	C extends WithInjectedProps< C, WithStateInnerProps< TState > >,
>(
	Inner: C
) => ComponentClass<
	JSX.LibraryManagedAttributes<
		C,
		WithoutInjectedProps< C, WithStateInnerProps< TState > >
	>,
	TState
>;
