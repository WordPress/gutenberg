/**
 * External dependencies
 */
import type { MouseEventHandler } from 'react';

export type Suggestion = string | { value: string };

type Messages = {
	added: string;
	removed: string;
	remove: string;
	__experimentalInvalid: string;
};

type Token = string;

export interface FormTokenFieldProps {
	suggestions?: string[];
	maxSuggestions?: number;
	value?: Suggestion[];
	displayTransform?: ( suggestion: Suggestion ) => string;
	saveTransform?: ( token: Token ) => string;
	onChange?: ( tokens: Token[] ) => void;
	onInputChange?: ( input: string ) => void;
	onFocus?: ( event: FocusEvent ) => void;
	isBorderless?: boolean;
	disabled?: boolean;
	tokenizeOnSpace?: boolean;
	messages?: Messages;
	__experimentalExpandOnFocus?: boolean;
	__experimentalValidateInput?: ( token: Token ) => boolean;
	__experimentalShowHowTo?: boolean;
}

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
