/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import type { CSSProperties, ReactNode } from 'react';

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
	size?: 'default' | 'small';
	hideLabelFromVision?: boolean;
	__unstableInputWidth?: CSSProperties[ 'width' ];
	prefix?: ReactNode;
	suffix?: ReactNode;
	labelPosition?: 'side' | 'edge';
}
