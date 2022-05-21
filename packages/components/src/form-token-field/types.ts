/**
 * External dependencies
 */
import type { MouseEventHandler } from 'react';

type Suggestion = string | { value: string };

export interface SuggestionsListProps< T = Suggestion > {
	selectedIndex: number;
	scrollIntoView: boolean;
	match: string;
	onHover: ( suggestion: T ) => void;
	onSelect: ( suggestion: T ) => void;
	suggestions: T[];
	displayTransform: ( value: T ) => string;
	instanceId: string;
}

export interface TokenProps< T = Suggestion > {
	value: string;
	status: 'error' | 'success' | 'validating';
	title: string;
	displayTransform: ( value: T ) => string;
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
