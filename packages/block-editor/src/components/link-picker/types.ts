import type {
	LinkControlValue,
	LinkPreviewBadge,
	LinkSuggestionsQuery,
	TransformSuggestions,
} from '../link-control/types';

/**
 * Preview data of the selected link.
 */
export interface LinkPickerPreview {
	/**
	 * Display title for the link.
	 */
	title?: string;
	/**
	 * Display URL for the link.
	 */
	url: string;
	/**
	 * Optional image URL for the link preview.
	 */
	image?: string | null;
	/**
	 * Optional badges with label and intent.
	 */
	badges?: LinkPreviewBadge[];
}

/**
 * The suggestion passed to `onSelect`.
 */
export type LinkPickerSuggestion = Pick<
	LinkControlValue,
	'url' | 'kind' | 'type' | 'id' | 'title'
>;

/**
 * Props of `LinkPicker`.
 */
export interface LinkPickerProps {
	preview: LinkPickerPreview;
	onSelect: ( suggestion: LinkPickerSuggestion ) => void;
	suggestionsQuery?: LinkSuggestionsQuery;
	/**
	 * Changes the suggestions before they're shown, such as to leave some out.
	 */
	transformSuggestions?: TransformSuggestions;
	label?: string;
	help?: string;
}

/**
 * Props of `LinkPreview`.
 */
export interface LinkPreviewProps {
	title: string;
	url?: string;
	image?: string | null;
	badges?: LinkPreviewBadge[];
}
