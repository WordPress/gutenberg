type RichTextFormat = {
	type: string;
};
type RichTextFormatList = Array< RichTextFormat >;
export type RichTextValue = {
	text: string;
	formats: Array< RichTextFormatList >;
	replacements: Array< RichTextFormat >;
	start: number | undefined;
	end: number | undefined;
};
