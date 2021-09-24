/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import type { SyntheticEvent } from 'react';

interface Props {
	isOpen: undefined;
	message: string;
	onConfirm: ( event: SyntheticEvent ) => void;
	onCancel?: ( event: SyntheticEvent ) => void;
}

export type OwnProps =
	| Props
	| {
			isOpen: boolean;
			message: string;
			onConfirm: ( event: SyntheticEvent ) => void;
			onCancel: ( event: SyntheticEvent ) => void;
	  };
