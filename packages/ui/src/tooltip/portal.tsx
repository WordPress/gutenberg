import { Tooltip as _Tooltip } from '@base-ui/react/tooltip';
import { forwardRef } from '@wordpress/element';
import type { PortalProps } from './types';
import { useWpCompatOverlayContainer } from '../utils/use-wp-compat-overlay-container';

/**
 * Used to apply custom portal behavior to `Tooltip`'s floating content.
 * `container` defaults to the `@wordpress/ui` compat overlay slot.
 */
const Portal = forwardRef< HTMLDivElement, PortalProps >(
	function TooltipPortal( { container, ...restProps }, ref ) {
		const portal = useWpCompatOverlayContainer( container );
		return (
			<>
				{ portal.needsSource && (
					<span hidden ref={ portal.setSource } />
				) }
				<_Tooltip.Portal
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
