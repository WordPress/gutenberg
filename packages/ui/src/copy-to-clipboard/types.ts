import type { ReactElement } from 'react';

export type CopyToClipboardStatus = 'pending' | 'success' | 'error';

export type CopyToClipboardOnCopy = ( text: string, result: boolean ) => void;

export type CopyToClipboardContent = (
	status: CopyToClipboardStatus
) => ReactElement;

export interface CopyToClipboardProps {
	/**
	 * The text to copy. Use a function if the value is not already available
	 * and is expensive to compute.
	 */
	text: string | ( () => string );

	/**
	 * Time in milliseconds before the status returns to `'pending'`.
	 *
	 * @default 1000
	 */
	timeout?: number;

	/**
	 * Called after a successful copy with the copied text. The second argument
	 * is always `true`.
	 */
	onCopy?: CopyToClipboardOnCopy;

	/**
	 * A single React element, or a render function that receives the current
	 * copy status. The element must accept a ref so the copy trigger can be
	 * attached.
	 */
	children: ReactElement | CopyToClipboardContent;
}
