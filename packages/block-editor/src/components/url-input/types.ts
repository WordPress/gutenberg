import type {
	KeyboardEvent,
	MutableRefObject,
	ReactNode,
	Ref,
	RefObject,
} from 'react';
import type {
	FetchLinkSuggestionsHandler,
	LinkControlSuggestion,
	LinkControlValidity,
} from '../link-control/types';

/**
 * HTML props of a suggestion item, built by `URLInput`.
 */
export interface SuggestionItemProps {
	role: string;
	/**
	 * `URLInput` passes `'-1'`, which React coerces like the number.
	 */
	tabIndex: number;
	id: string;
	ref: ( node: HTMLElement | null ) => void;
	'aria-selected'?: boolean;
	/**
	 * Updates the active suggestion when the pointer moves over the item.
	 */
	onMouseMove?: () => void;
}

/**
 * Props `URLInput` passes to its suggestions render prop.
 */
export interface URLInputSuggestionsProps {
	suggestions: LinkControlSuggestion[];
	selectedSuggestion: number | null;
	suggestionsListProps: {
		id: string;
		ref?: Ref< HTMLDivElement >;
		role: string;
	};
	buildSuggestionItemProps: (
		suggestion: LinkControlSuggestion,
		index: number
	) => SuggestionItemProps;
	isLoading: boolean;
	handleSuggestionClick: ( suggestion: LinkControlSuggestion ) => void;
	isInitialSuggestions: boolean;
	currentInputValue: string | null;
}

/**
 * A pending link suggestions request, which a fetcher may make cancelable.
 */
export type LinkSuggestionsRequest = Promise< LinkControlSuggestion[] > & {
	cancel?: () => void;
};

/**
 * Props of the `BaseControl` wrapping the `URLInput` field.
 */
export interface URLInputControlProps {
	id: string;
	label: string | null;
	className: string;
	hideLabelFromVision: boolean;
}

/**
 * Props of the `URLInput` field.
 */
export interface URLInputInputProps {
	id: string;
	value: string;
	required: boolean;
	type: string;
	name: string;
	autoComplete: string;
	onChange: ( newValue: string ) => void;
	onCompositionStart: () => void;
	onCompositionEnd: () => void;
	onFocus: () => void;
	onKeyDown: ( event: KeyboardEvent< HTMLInputElement > ) => void;
	placeholder: string;
	role: string;
	'aria-label': string | undefined;
	'aria-expanded': boolean;
	'aria-autocomplete': 'list';
	'aria-owns': string;
	'aria-activedescendant': string | undefined;
	ref: RefObject< HTMLInputElement | null >;
	disabled: boolean;
	suffix: ReactNode;
	help: ReactNode;
}

/**
 * Props of `URLInput`.
 */
export interface URLInputProps {
	/**
	 * Fetches the suggestions, in place of the
	 * `__experimentalFetchLinkSuggestions` editor setting.
	 */
	__experimentalFetchLinkSuggestions?: FetchLinkSuggestionsHandler;
	/**
	 * Whether to request suggestions for a value that is a URL.
	 */
	__experimentalHandleURLSuggestions?: boolean;
	/**
	 * Renders the field in place of the default input control.
	 */
	__experimentalRenderControl?: (
		controlProps: URLInputControlProps,
		inputProps: URLInputInputProps,
		isLoading: boolean
	) => ReactNode;
	/**
	 * Renders the suggestions in place of the default list.
	 */
	__experimentalRenderSuggestions?:
		( ( props: URLInputSuggestionsProps ) => ReactNode ) | null;
	/**
	 * Whether to request suggestions for an empty value.
	 */
	__experimentalShowInitialSuggestions?: boolean;
	/**
	 * A ref to the suggestions list.
	 */
	autocompleteRef?: Ref< HTMLDivElement >;
	/**
	 * Adds and optional class to the parent `div` that wraps the URLInput
	 * field and popover
	 */
	className?: string | null;
	/**
	 * The validity reported on the field.
	 */
	customValidity?: LinkControlValidity;
	/**
	 * Provides additional control over whether suggestions are disabled.
	 */
	disableSuggestions?: boolean;
	disabled?: boolean;
	help?: ReactNode;
	hideLabelFromVision?: boolean;
	/**
	 * A ref to the input element.
	 */
	inputRef?: RefObject< HTMLInputElement | null >;
	isFullWidth?: boolean;
	/**
	 * If this property is added, a label will be generated using label
	 * property as the content.
	 */
	label?: string | null;
	/**
	 * Whether to hide the "(Required)" indicator once the field is validated.
	 */
	markWhenOptional?: boolean;
	/**
	 * Called when the value changes, with the selected suggestion when the
	 * user selects one from the suggestions dropdown.
	 */
	onChange: ( url: string, post?: LinkControlSuggestion ) => void;
	/**
	 * A callback invoked on the keydown event.
	 */
	onKeyDown?: ( event: KeyboardEvent< HTMLInputElement > ) => void;
	/**
	 * Called when the user presses `Enter`, with the selected suggestion if
	 * any.
	 */
	onSubmit?: (
		suggestion: LinkControlSuggestion | null,
		event: KeyboardEvent< HTMLInputElement >
	) => void;
	/**
	 * Placeholder text to show when the field is empty.
	 */
	placeholder?: string;
	required?: boolean;
	suffix?: ReactNode;
	/**
	 * The URL, stored by the attribute or component state.
	 */
	value?: string;
}

/**
 * Props of the `URLInput` field control.
 */
export interface URLInputFieldProps {
	controlProps: URLInputControlProps;
	inputProps: URLInputInputProps;
	isLoading: boolean;
	customValidity: LinkControlValidity | undefined;
	markWhenOptional: boolean | undefined;
	renderControl: URLInputProps[ '__experimentalRenderControl' ];
}

/**
 * Props of the `URLInput` suggestions list.
 */
export interface URLInputSuggestionsListProps {
	autocompleteRef: Ref< HTMLDivElement > | undefined;
	className: string | null | undefined;
	handleSuggestionClick: ( suggestion: LinkControlSuggestion ) => void;
	isLoading: boolean;
	renderSuggestions: URLInputProps[ '__experimentalRenderSuggestions' ];
	selectedSuggestion: number | null;
	suggestionNodesRef: MutableRefObject< ( HTMLElement | null )[] >;
	onSuggestionHover: ( index: number ) => void;
	suggestionOptionIdPrefix: string;
	suggestions: LinkControlSuggestion[];
	suggestionsListboxId: string;
	suggestionsValue: string | null;
}

/**
 * Props of `URLInputButton`.
 */
export interface URLInputButtonProps {
	/**
	 * The current URL value.
	 */
	url?: string;
	/**
	 * Callback function to handle URL changes.
	 */
	onChange: URLInputProps[ 'onChange' ];
}
