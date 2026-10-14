import type { Component } from 'react';

/**
 * Props the wrapped component receives: its own, the state and `setState`.
 */
export type WithStateInnerProps<
	TState extends object,
	TOwnProps extends object = object,
> = TState & {
	setState: Component< TOwnProps, TState >[ 'setState' ];
};
