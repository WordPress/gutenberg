import { createContext, useContext } from '@wordpress/element';
import type { ClipboardButtonStatus } from './types';

export type ClipboardButtonContextValue = {
	status: ClipboardButtonStatus;
	isIconOnly: boolean;
};

const fallbackContext: ClipboardButtonContextValue = {
	status: 'pending',
	isIconOnly: false,
};

export const ClipboardButtonContext =
	createContext< ClipboardButtonContextValue | null >( null );

export function useClipboardButtonContext() {
	const context = useContext( ClipboardButtonContext );

	if ( process.env.NODE_ENV !== 'production' && ! context ) {
		throw new Error(
			'ClipboardButton.Icon: Missing parent <ClipboardButton>. Render <ClipboardButton.Icon> inside <ClipboardButton>.'
		);
	}

	return context ?? fallbackContext;
}
