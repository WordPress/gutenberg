import type { ElementType, HTMLAttributes } from 'react';
import type { RichTextProps } from '../rich-text/types';

export type EditableTextProps = Omit<
	RichTextProps,
	'ref' | '__unstableDisableFormats'
>;

export type EditableTextContentProps = {
	value?: string;
	tagName?: ElementType;
} & HTMLAttributes< HTMLElement >;
