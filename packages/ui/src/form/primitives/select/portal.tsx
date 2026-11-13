import { Select as _Select } from '@base-ui/react/select';
import { forwardRef } from '@wordpress/element';
import type { PortalProps } from './types';
import { useWpCompatOverlayContainer } from '../../../utils/use-wp-compat-overlay-container';

/**
 * Used to apply custom portal behavior to `Select`'s listbox content.
 * `container` defaults to the `@wordpress/ui` compat overlay slot.
 */
const Portal = forwardRef< HTMLDivElement, PortalProps >( function SelectPortal(
	{ container, ...restProps },
	ref
) {
	const portal = useWpCompatOverlayContainer( container );
	return (
		<>
			<span hidden ref={ portal.setSource } />
			<_Select.Portal
				container={ portal.container }
				{ ...restProps }
				ref={ ref }
				data-wp-ui-overlay-portal=""
			/>
		</>
	);
} );

export { Portal };
