import type { RichTextValue } from '@wordpress/rich-text';

/**
 * The props the rich text toolbar passes to every format's `edit()`.
 *
 * The two attribute bags are whatever the format was parsed with, so they are
 * typed as the string map they are at runtime. A format that knows the shape
 * of its own attributes narrows them where it reads them.
 */
export interface FormatEditProps {
	isActive: boolean;
	activeAttributes: Record< string, string >;
	isObjectActive: boolean;
	activeObjectAttributes: Record< string, string >;
	value: RichTextValue;
	onChange: ( value: RichTextValue ) => void;
	onFocus: () => void;
	contentRef: React.RefObject< HTMLElement >;
	/**
	 * The block context values the format asked for through `usesContext`.
	 */
	context: Record< string, unknown >;
	/**
	 * Whether the format's toolbar button should render. Hosts that never hide
	 * format buttons leave it unset, so treat an absent value as `true`.
	 */
	isVisible?: boolean;
}
