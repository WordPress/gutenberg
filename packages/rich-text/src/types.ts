/**
 * Stores the type of a rich text format, such as core/bold.
 */
export type RichTextFormat = {
	type:
		| 'core/bold'
		| 'core/italic'
		| 'core/link '
		| 'core/strikethrough'
		| 'core/image'
		| string;
};

/**
 * A list of rich text format types.
 */
export type RichTextFormatList = Array< RichTextFormat >;

/**
 * An object which represents a formatted string. `_formats` is the canonical
 * storage: a `Map` from format reference to a `[start, end)` range. `formats`
 * is a backward-compatible derived sparse array — reading it materialises a
 * snapshot from `_formats`; it is deprecated and will be removed in a future
 * release. Mutating `formats` directly (e.g. `value.formats[i] = ...`) does
 * not propagate; mutate `_formats` or assign a fresh array to `formats`.
 */
export type RichTextValue = {
	text: string;
	formats: Array< RichTextFormatList >;
	_formats: Map< RichTextFormat, [ number, number ] >;
	replacements: Array< RichTextFormat >;
	start: number;
	end: number;
	activeFormats?: RichTextFormatList;
};
