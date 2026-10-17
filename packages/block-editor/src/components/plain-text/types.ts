import type { TextareaHTMLAttributes } from 'react';
import type { EditableTextProps } from '../editable-text/types';

/**
 * Props of the textarea that `PlainText` renders by default.
 */
export type PlainTextTextareaProps = Omit<
	TextareaHTMLAttributes< HTMLTextAreaElement >,
	'onChange'
> & {
	__experimentalVersion?: number;
	onChange: ( value: string ) => void;
};

/**
 * Props of `PlainText`. Version `2` renders an editable text field in place
 * of the textarea, and takes its props.
 */
export type PlainTextProps =
	| PlainTextTextareaProps
	| ( EditableTextProps & { __experimentalVersion: 2 } );
