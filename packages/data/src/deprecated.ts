/**
 * Internal dependencies
 */
import type {
	DataRegistry,
	MapSelect,
	StoreDescriptor,
	CurriedSelectorsOf,
	ActionCreatorsOf,
} from './types';

/** @deprecated Use `DataRegistry['select']` instead. */
export type SelectFunction = DataRegistry[ 'select' ];

/** @deprecated Use `DataRegistry['dispatch']` instead. */
export type DispatchFunction = DataRegistry[ 'dispatch' ];

/** @deprecated Use `ActionCreatorsOf<S>` directly. */
export type DispatchReturn< S > = S extends StoreDescriptor< any >
	? ActionCreatorsOf< S >
	: unknown;

/** @deprecated Use `ReturnType<F>` for MapSelect, or `CurriedSelectorsOf<S>` for StoreDescriptor. */
export type UseSelectReturn< F extends MapSelect | StoreDescriptor< any > > =
	F extends MapSelect
		? ReturnType< F >
		: F extends StoreDescriptor< any >
		? CurriedSelectorsOf< F >
		: never;

/** @deprecated Use `ActionCreatorsOf<S>` for StoreDescriptor, or `DataRegistry['dispatch']` for the no-arg case. */
export type UseDispatchReturn< S > = S extends StoreDescriptor< any >
	? ActionCreatorsOf< S >
	: S extends undefined
	? DataRegistry[ 'dispatch' ]
	: any;
