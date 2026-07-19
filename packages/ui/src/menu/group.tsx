import { Menu as _Menu } from '@base-ui/react/menu';
import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import itemLayoutStyles from '../utils/item-layout/style.module.css';
import styles from './style.module.css';
import type { GroupProps } from './types';

/**
 * Groups related menu items with a corresponding label.
 */
const Group = forwardRef< HTMLDivElement, GroupProps >( function MenuGroup(
	{ className, ...props },
	ref
) {
	return (
		<_Menu.Group
			ref={ ref }
			className={ clsx(
				itemLayoutStyles[ 'alignment-group' ],
				styles.group,
				className
			) }
			{ ...props }
		/>
	);
} );

export { Group };
