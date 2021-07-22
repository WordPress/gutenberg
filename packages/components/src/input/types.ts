/**
 * Internal dependencies
 */
import type { StateReducer } from './reducer/state';

export type DragDirection = 'n' | 's' | 'e' | 'w';

export interface Props {
	dragDirection?: DragDirection;
	dragThreshold?: number;
	isDragEnabled?: boolean;
	isFocused?: boolean;
	isPressEnterToChange?: boolean;
	onValidate?: ( nextValue: string ) => void;
	setIsFocused?: ( isFocused: boolean ) => void;
	stateReducer?: StateReducer;
	value?: string;
}
