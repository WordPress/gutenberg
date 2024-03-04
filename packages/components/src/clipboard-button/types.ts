/**
 * External dependencies
 */
import type { ReactNode } from 'react';

export interface ClipboardButtonProps {
	children: ReactNode;
	onCopy: () => void;
	onFinishCopy?: () => void;
	text: string;
}
