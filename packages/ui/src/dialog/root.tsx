import { Dialog as _Dialog } from '@base-ui/react/dialog';
import type { RootProps } from './types';

/**
 * Groups the dialog trigger and popup.
 *
 * `Dialog` is a collection of React components that combine to render
 * an ARIA-compliant dialog pattern.
 */
function Root( props: RootProps ) {
	return <_Dialog.Root { ...props } />;
}

export { Root };
