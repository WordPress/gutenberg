import { Menu as _Menu } from '@base-ui/react/menu';
import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import { MenuGroupContext, useMenuGroupContext } from './context';
import styles from './style.module.css';
import type { RadioGroupProps } from './types';

/**
 * Groups related radio menu items.
 *
 * Put `Menu.GroupLabel` inside this component to label the radio group.
 * Do not wrap it in `Menu.Group` or put `Menu.Group` inside it.
 */
const RadioGroup = forwardRef< HTMLDivElement, RadioGroupProps >(
	function MenuRadioGroup( { className, ...props }, ref ) {
		const parentGroup = useMenuGroupContext();
		if (
			process.env.NODE_ENV !== 'production' &&
			parentGroup === 'group'
		) {
			throw new Error(
				'Menu.RadioGroup: Cannot be nested inside Menu.Group. Move Menu.RadioGroup outside Menu.Group and put its Menu.GroupLabel inside Menu.RadioGroup.'
			);
		}

		return (
			<MenuGroupContext.Provider value="radio-group">
				<_Menu.RadioGroup
					ref={ ref }
					className={ clsx( styles[ 'radio-group' ], className ) }
					{ ...props }
				/>
			</MenuGroupContext.Provider>
		);
	}
);

export { RadioGroup };
