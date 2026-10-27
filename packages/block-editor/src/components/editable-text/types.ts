import type { ElementType, HTMLAttributes } from 'react';
import type { RichTextProps } from '../rich-text/types';

// Editable text holds plain text, so the value is a string.
export type EditableTextProps = Omit<
	RichTextProps< string >,
	'ref' | '__unstableDisableFormats'
>;

export type EditableTextContentProps = {
	value?: string;
	tagName?: ElementType;
} & HTMLAttributes< HTMLElement >;
