/**
 * External dependencies
 */
import type { ComponentPropsWithRef, MouseEventHandler } from 'react';

type Messages = {
	added: string;
	removed: string;
	remove: string;
	__experimentalInvalid: string;
};

export interface TokenItem {
	value: string;
	status?: 'error' | 'success' | 'validating';
	title?: string;
	isBorderless?: boolean;
	onMouseEnter?: MouseEventHandler< HTMLSpanElement >;
	onMouseLeave?: MouseEventHandler< HTMLSpanElement >;
}

export interface FormTokenFieldProps
	extends Pick<
		ComponentPropsWithRef< 'input' >,
		| 'autoCapitalize'
		| 'autoComplete'
		| 'maxLength'
		| 'placeholder'
		| 'className'
	> {
	label?: string;
	suggestions?: string[];
	maxSuggestions?: number;
	value?: ( string | TokenItem )[];
	displayTransform?: ( suggestion: string ) => string;
	saveTransform?: ( token: string ) => string;
	onChange?: ( tokens: ( string | TokenItem )[] ) => void;
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
	instanceId: string | number;
}

export interface TokenProps extends TokenItem {
	displayTransform: ( value: string ) => string;
	disabled: boolean;
	onClickRemove: ( { value }: { value: string } ) => void;
	messages: Messages;
	termPosition: number;
	termsCount: number;
}

export interface TokenInputProps {
	isExpanded: boolean;
	instanceId: string | number;
	selectedSuggestionIndex: number;
	onChange?: ( { value }: { value: string } ) => void;
	value: string;
}
