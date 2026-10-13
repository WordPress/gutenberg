import type { Component } from 'react';

/**
 * Props the wrapped component receives: its own, the state and `setState`.
 */
export type WithStateInnerProps< TState extends object > = TState & {
	setState: Component< object, TState >[ 'setState' ];
};
