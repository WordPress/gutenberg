/**
 * External dependencies
 */
import type { MouseEventHandler } from 'react';

type Messages = {
	added: string;
	removed: string;
	remove: string;
	__experimentalInvalid: string;
};

export interface FormTokenFieldProps {
	suggestions?: string[];
	maxSuggestions?: number;
	value?: string[];
	displayTransform?: ( suggestion: string ) => string;
	saveTransform?: ( token: string ) => string;
	onChange?: ( tokens: string[] ) => void;
	onInputChange?: ( input: string ) => void;
	onFocus?: ( event: FocusEvent ) => void;
	isBorderless?: boolean;
	disabled?: boolean;
	tokenizeOnSpace?: boolean;
	messages?: Messages;
	__experimentalExpandOnFocus?: boolean;
	__experimentalValidateInput?: ( token: string ) => boolean;
	__experimentalShowHowTo?: boolean;
}

export interface SuggestionsListProps< T = string | { value: string } > {
	selectedIndex: number;
	scrollIntoView: boolean;
	match: T;
	onHover: ( suggestion: T ) => void;
	onSelect: ( suggestion: T ) => void;
	suggestions: T[];
	displayTransform: ( value: T ) => string;
	instanceId: string;
}

export interface TokenProps {
	value: string;
	status: 'error' | 'success' | 'validating';
	title: string;
	displayTransform: ( value: string ) => string;
	isBorderless: boolean;
	disabled: boolean;
	onClickRemove: ( { value }: { value: string } ) => void;
	onMouseEnter: MouseEventHandler< HTMLSpanElement >;
	onMouseLeave: MouseEventHandler< HTMLSpanElement >;
	messages: Messages;
	termPosition: number;
	termsCount: number;
}

export interface TokenInputProps {
	isExpanded: boolean;
	instanceId: string;
	selectedSuggestionIndex: number;
	onChange?: ( { value }: { value: string } ) => void;
	value: string;
}
