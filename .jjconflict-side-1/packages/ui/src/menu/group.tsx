import { Menu as _Menu } from '@base-ui/react/menu';
import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import { MenuGroupContext, useMenuGroupContext } from './context';
import styles from './style.module.css';
import type { GroupProps } from './types';

/**
 * Groups related menu items with a corresponding label.
 *
 * Use `Menu.RadioGroup` instead for radio items. Do not nest `Menu.Group` and
 * `Menu.RadioGroup` within each other in the same menu. They can be siblings.
 */
const Group = forwardRef< HTMLDivElement, GroupProps >( function MenuGroup(
	{ className, ...props },
	ref
) {
	const parentGroup = useMenuGroupContext();
	if (
		process.env.NODE_ENV !== 'production' &&
		parentGroup === 'radio-group'
	) {
		throw new Error(
			'Menu.Group: Cannot be nested inside Menu.RadioGroup. Remove Menu.Group and put Menu.GroupLabel and Menu.RadioItem directly inside Menu.RadioGroup.'
		);
	}

	return (
		<MenuGroupContext.Provider value="group">
			<_Menu.Group
				ref={ ref }
				className={ clsx( styles.group, className ) }
				{ ...props }
			/>
		</MenuGroupContext.Provider>
	);
} );

export { Group };
