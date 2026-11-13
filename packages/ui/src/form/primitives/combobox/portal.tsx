import { Combobox as _Combobox } from '@base-ui/react/combobox';
import { forwardRef } from '@wordpress/element';
import type { PortalProps } from './types';
import { useWpCompatOverlayContainer } from '../../../utils/use-wp-compat-overlay-container';

/**
 * Root element that portals `Combobox` popup content. Pass to
 * `Combobox.Popup`'s `portal` prop. When `portal` is omitted,
 * `Combobox.Popup` uses this component with default props.
 * `container` defaults to the `@wordpress/ui` compat overlay slot.
 */
const Portal = forwardRef< HTMLDivElement, PortalProps >(
	function ComboboxPortal( { container, ...restProps }, ref ) {
		const portal = useWpCompatOverlayContainer( container );
		return (
			<>
				<span hidden ref={ portal.setSource } />
				<_Combobox.Portal
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
