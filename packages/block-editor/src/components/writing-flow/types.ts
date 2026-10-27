import type { HTMLAttributes, ReactNode } from 'react';

/**
 * The `SyntheticEvent`-like object a block's `wrapperProps` event handler
 * receives when the writing flow host calls it under `editableRoot`.
 */
export interface BlockSyntheticEvent {
	nativeEvent: Event;
	type: string;
	target: Element | undefined;
	currentTarget: Element | null;
	defaultPrevented?: boolean;
	preventDefault: () => void;
	isDefaultPrevented: () => boolean | undefined;
	stopPropagation: () => void;
	isPropagationStopped: () => boolean;
	persist: () => void;
	isPersistent: () => boolean;
	[ property: string ]: unknown;
}

/**
 * A block's `wrapperProps` event handler.
 */
export type BlockEventHandler = ( event: BlockSyntheticEvent ) => void;

/**
 * A block's `wrapperProps` event handlers, keyed by DOM event type.
 */
export type BlockEventHandlers = Record< string, BlockEventHandler >;

/**
 * A key down event, or an Enter `beforeinput` event, which writing flow
 * handles alike. Rich text flags its legacy split handler on the event.
 */
export type WritingFlowKeyEvent = KeyboardEvent &
	Partial< Pick< InputEvent, 'inputType' > > & {
		__deprecatedOnSplit?: unknown;
	};

/**
 * A clipboard event, or a drop event, which is handled as a paste. Rich text
 * flags it when it has a legacy split handler.
 */
export type WritingFlowClipboardEvent = ( ClipboardEvent | DragEvent ) & {
	__deprecatedOnSplit?: unknown;
};

/**
 * Props of `WritingFlow`, which renders a `div` around the block list.
 */
export type WritingFlowProps = HTMLAttributes< HTMLDivElement > & {
	children?: ReactNode;
};
