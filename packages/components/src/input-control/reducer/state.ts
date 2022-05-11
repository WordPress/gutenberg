/**
 * External dependencies
 */
import type { Reducer } from 'react';

/**
 * Internal dependencies
 */
import type { InputAction } from './actions';

export interface InputState {
	error: unknown;
	initialValue: string;
	isDirty: boolean;
	isDragEnabled: boolean;
	isDragging: boolean;
	isPressEnterToChange: boolean;
	value: string;
}

export type StateReducer = Reducer<
	InputState,
	InputAction | Partial< InputState >
>;
export type SecondaryReducer = Reducer< InputState, InputAction >;

export const initialStateReducer: StateReducer = ( state: InputState ) => state;

export const initialInputControlState: InputState = {
	error: null,
	initialValue: '',
	isDirty: false,
	isDragEnabled: false,
	isDragging: false,
	isPressEnterToChange: false,
	value: '',
};
