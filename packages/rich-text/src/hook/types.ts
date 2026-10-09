import type { RefObject } from 'react';
import type { RichTextData } from '../create';
import type { RichTextFormatList, RichTextValue } from '../types';

/**
 * The internal record of a rich text field. `_newActiveFormats` holds the
 * active formats picked by arrow key navigation until the selection syncs.
 */
export type RichTextRecord = RichTextValue & {
	_newActiveFormats?: RichTextFormatList;
};

/**
 * Derives formats from a record, such as adding or removing editor only ones.
 */
export type RecordFormatsHandler = (
	record: RichTextRecord
) => RichTextFormatList[];

/**
 * Change metadata passed to `onChange`.
 */
export type RichTextChangeMeta = {
	__unstableFormats: RichTextFormatList[];
	__unstableText: string;
};

/**
 * Props of `useRichText` before the format types add their handlers.
 */
export type RichTextBaseProps = {
	value?: string | RichTextData;
	selectionStart?: number;
	selectionEnd?: number;
	placeholder?: string;
	onSelectionChange: ( start?: number, end?: number ) => void;
	preserveWhiteSpace?: boolean;
	onChange: (
		value: string | RichTextData,
		meta: RichTextChangeMeta
	) => void;
	__unstableDisableFormats?: boolean;
	__unstableIsSelected?: boolean;
	__unstableDependencies?: unknown[];
	__unstableAfterParse?: RecordFormatsHandler;
	__unstableBeforeSerialize?: RecordFormatsHandler;
	__unstableAddInvisibleFormats?: RecordFormatsHandler;
};

/**
 * Props of `useRichText`.
 */
export type RichTextProps = Omit<
	RichTextBaseProps,
	| '__unstableAfterParse'
	| '__unstableBeforeSerialize'
	| '__unstableAddInvisibleFormats'
> & {
	allowedFormats?: string[];
	withoutInteractiveFormatting?: boolean;
	__unstableFormatTypeHandlerContext?: object;
};

/**
 * Options of `applyRecord`.
 */
export type ApplyRecordOptions = {
	domOnly?: boolean;
};

/**
 * The latest props of the event listeners, read when an event fires.
 */
export type EventListenerProps = {
	record: RefObject< RichTextRecord >;
	handleChange: ( record: RichTextRecord ) => void;
	applyRecord: (
		record: RichTextRecord,
		options?: ApplyRecordOptions
	) => void;
	createRecord: () => RichTextValue;
	isSelected?: boolean;
	onSelectionChange: ( start?: number, end?: number ) => void;
	forceRender: () => void;
};

/**
 * Subscribes listeners to the editable element and returns a cleanup.
 */
export type EventListenerEffect = (
	props: RefObject< EventListenerProps >
) => ( element: HTMLElement ) => () => void;
