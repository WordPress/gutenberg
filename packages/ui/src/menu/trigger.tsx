import { Menu as _Menu } from '@base-ui/react/menu';
import { forwardRef } from '@wordpress/element';
import type { TriggerProps } from './types';

/**
 * Renders the button that opens the menu.
 */
const Trigger = forwardRef< HTMLButtonElement, TriggerProps >(
	function MenuTrigger( props, ref ) {
		return <_Menu.Trigger ref={ ref } { ...props } />;
	}
);

export { Trigger };
