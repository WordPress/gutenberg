import { Menu as _Menu } from '@base-ui/react/menu';
import type { RadioGroupProps } from './types';

/**
 * Groups related radio menu items.
 */
function RadioGroup( props: RadioGroupProps ) {
	return <_Menu.RadioGroup { ...props } />;
}

export { RadioGroup };
