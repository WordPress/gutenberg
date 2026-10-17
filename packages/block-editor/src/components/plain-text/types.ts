import type { TextareaHTMLAttributes } from 'react';

export type PlainTextProps = Omit<
	TextareaHTMLAttributes< HTMLTextAreaElement >,
	'onChange'
> & {
	/**
	 * `2` renders an editable text field in place of the textarea.
	 */
	__experimentalVersion?: number;
	onChange: ( value: string ) => void;
};
