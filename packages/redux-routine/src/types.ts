import type { AnyAction } from 'redux';

/** Object of control handlers keyed by action type. */
export type Controls = Record< string, ( value: AnyAction ) => unknown >;

/** Dispatches a generator through the co-routine runtime. */
export type RoutineDispatch = (
	routine: Generator< unknown, unknown, unknown >
) => Promise< unknown >;
