import { Popover as _Popover } from '@base-ui/react/popover';
import { forwardRef } from '@wordpress/element';
import type { PortalProps } from './types';
import { useWpCompatOverlayContainer } from '../utils/use-wp-compat-overlay-container';

/**
 * Used to apply custom portal behavior to `Popover`'s floating content.
 * `container` defaults to the `@wordpress/ui` compat overlay slot.
 */
const Portal = forwardRef< HTMLDivElement, PortalProps >(
	function PopoverPortal( { container, ...restProps }, ref ) {
		const portal = useWpCompatOverlayContainer( container );
		return (
			<>
				<span hidden ref={ portal.setSource } />
				<_Popover.Portal
					container={ portal.container }
					{ ...restProps }
					ref={ ref }
					data-wp-ui-overlay-portal=""
				/>
			</>
		);
	}
);

export { Portal };
