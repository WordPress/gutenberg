/**
 * External dependencies
 */
import { Dialog } from '@base-ui/react/dialog';
import { useMemo } from 'react';

/**
 * Internal dependencies
 */
import { type RootProps } from './types';
import { DialogContext } from './context';

function Root( { title, ...props }: RootProps ) {
	const contextValue = useMemo( () => ( { title } ), [ title ] );

	return (
		<Dialog.Root { ...props }>
			<DialogContext.Provider value={ contextValue }>
				{ props.children }
			</DialogContext.Provider>
		</Dialog.Root>
	);
}

export { Root };
