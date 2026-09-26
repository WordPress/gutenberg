import { Dialog as _Dialog } from '@base-ui/react/dialog';
import { forwardRef } from '@wordpress/element';
import type { PortalProps } from './types';

/**
 * Used to apply custom portal behavior to `Dialog`'s overlay content.
 */
const Portal = forwardRef< HTMLDivElement, PortalProps >(
	function DialogPortal( props, ref ) {
		return <_Dialog.Portal ref={ ref } { ...props } />;
	}
);

export { Portal };
