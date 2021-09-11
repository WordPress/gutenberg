/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import type { SyntheticEvent } from 'react';

export interface OwnProps {
	isOpen?: boolean;
	selfClose?: boolean;
	message: string;
	onConfirm: ( event: SyntheticEvent ) => void;
	onCancel?: ( event: SyntheticEvent ) => void;
}
