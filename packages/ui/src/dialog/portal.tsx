import { Dialog as _Dialog } from '@base-ui/react/dialog';
import { forwardRef } from '@wordpress/element';
import { useWpCompatOverlayContainer } from '../utils/use-wp-compat-overlay-container';
import type { PortalProps } from './types';

/**
 * Used to apply custom portal behavior to `Dialog`'s overlay content.
 */
const Portal = forwardRef< HTMLDivElement, PortalProps >( function DialogPortal(
	{ container, ...restProps },
	ref
) {
	const portal = useWpCompatOverlayContainer( container );
	return (
		<>
			<span hidden ref={ portal.setSource } />
			<_Dialog.Portal
				ref={ ref }
				data-wp-ui-overlay-portal=""
				container={ portal.container }
				{ ...restProps }
			/>
		</>
	);
} );

export { Portal };
