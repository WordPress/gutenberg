import { Drawer as _Drawer } from '@base-ui/react/drawer';
import { forwardRef } from '@wordpress/element';
import type { TriggerProps } from './types';

/**
 * Renders a button that opens the drawer popup when clicked.
 */
const Trigger = forwardRef< HTMLButtonElement, TriggerProps >(
	function DrawerTrigger( props, ref ) {
		return <_Drawer.Trigger ref={ ref } { ...props } />;
	}
);

export { Trigger };
