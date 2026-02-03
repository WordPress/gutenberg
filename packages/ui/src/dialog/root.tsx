import { Dialog as _Dialog } from '@base-ui/react/dialog';
import { useMemo } from '@wordpress/element';
import { DialogContext } from './context';
import type { RootProps } from './types';

/**
 * Groups the dialog trigger and popup.
 *
 * `Dialog` is a collection of React components that combine to render
 * an ARIA-compliant dialog pattern.
 */
function Root( { title, ...props }: RootProps ) {
	const contextValue = useMemo( () => ( { title } ), [ title ] );

	return (
		<_Dialog.Root { ...props }>
			<DialogContext.Provider value={ contextValue }>
				{ props.children }
			</DialogContext.Provider>
		</_Dialog.Root>
	);
}

export { Root };
