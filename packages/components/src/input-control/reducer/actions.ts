/**
 * External dependencies
 */
import type { SyntheticEvent } from 'react';

/**
 * Internal dependencies
 */
import type { DragProps } from '../types';

export const CHANGE = 'CHANGE';
export const COMMIT = 'COMMIT';
export const DRAG_END = 'DRAG_END';
export const DRAG_START = 'DRAG_START';
export const DRAG = 'DRAG';
export const INVALIDATE = 'INVALIDATE';
export const PRESS_DOWN = 'PRESS_DOWN';
export const PRESS_ENTER = 'PRESS_ENTER';
export const PRESS_UP = 'PRESS_UP';
export const RESET = 'RESET';
export const UPDATE = 'UPDATE';

interface EventPayload {
	event?: SyntheticEvent;
}

interface Action< Type, ExtraPayload = {} > {
	type: Type;
	payload: EventPayload & ExtraPayload;
}

interface ValuePayload {
	value: string;
}

interface ErrorPayload {
	value: string;
	error: unknown;
}

export type ChangeAction = Action< typeof CHANGE, ValuePayload >;
export type CommitAction = Action< typeof COMMIT, ValuePayload >;
export type PressUpAction = Action< typeof PRESS_UP >;
export type PressDownAction = Action< typeof PRESS_DOWN >;
export type PressEnterAction = Action< typeof PRESS_ENTER >;
export type DragStartAction = Action< typeof DRAG_START, DragProps >;
export type DragEndAction = Action< typeof DRAG_END, DragProps >;
export type DragAction = Action< typeof DRAG, DragProps >;
export type ResetAction = Action< typeof RESET, Partial< ValuePayload > >;
export type UpdateAction = Action< typeof UPDATE, ValuePayload >;
export type InvalidateAction = Action< typeof INVALIDATE, ErrorPayload >;

export type ChangeEventAction =
	| ChangeAction
	| ResetAction
	| CommitAction
	| UpdateAction;

export type DragEventAction = DragStartAction | DragEndAction | DragAction;

export type KeyEventAction = PressDownAction | PressUpAction | PressEnterAction;

export type InputAction =
	| ChangeEventAction
	| KeyEventAction
	| DragEventAction
	| InvalidateAction;
