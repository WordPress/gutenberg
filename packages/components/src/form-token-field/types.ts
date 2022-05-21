/**
 * External dependencies
 */
import type { MouseEventHandler } from 'react';

export interface TokenProps {
	value: string;
	status: 'error' | 'success' | 'validating';
	title: string;
	displayTransform;
	isBorderless: boolean;
	disabled: boolean;
	onClickRemove: ( { value }: { value: string } ) => void;
	onMouseEnter: MouseEventHandler< HTMLSpanElement >;
	onMouseLeave: MouseEventHandler< HTMLSpanElement >;
	messages: {
		remove: string;
	};
	termPosition: number;
	termsCount: number;
}

export interface TokenInputProps {
	isExpanded: boolean;
	instanceId: string;
	selectedSuggestionIndex: number;
	onChange: ( { value: string } ) => void;
	value: string;
}
