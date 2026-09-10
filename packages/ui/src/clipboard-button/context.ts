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

export function useClipboardButtonContext(
	componentName: 'ClipboardButton.Icon' | 'ClipboardButton.Label'
) {
	const context = useContext( ClipboardButtonContext );

	if ( process.env.NODE_ENV !== 'production' && ! context ) {
		throw new Error(
			`${ componentName }: Missing parent <ClipboardButton>. Render <${ componentName }> inside <ClipboardButton>.`
		);
	}

	return context ?? fallbackContext;
}
