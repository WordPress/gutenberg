import { DirectionProvider as BaseUIDirectionProvider } from '@base-ui/react/direction-provider';
import { isRTL } from '@wordpress/i18n';
import type { ReactNode } from 'react';

type DirectionProviderProps = {
	children: ReactNode;
};

/**
 * Provides WordPress's text direction to Base UI components.
 */
function DirectionProvider( { children }: DirectionProviderProps ) {
	return (
		<BaseUIDirectionProvider direction={ isRTL() ? 'rtl' : 'ltr' }>
			{ children }
		</BaseUIDirectionProvider>
	);
}

export { DirectionProvider };
