import { Menu as _Menu } from '@base-ui/react/menu';
import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import { chevronRightSmall } from '@wordpress/icons';
import { Icon } from '../icon';
import itemPopupStyles from '../utils/css/item-popup.module.css';
import resetStyles from '../utils/css/resets.module.css';
import styles from './style.module.css';
import { ItemContent } from './item';
import type { SubmenuTriggerProps } from './types';

/**
 * Renders a menu item that opens a submenu.
 */
const SubmenuTrigger = forwardRef< HTMLDivElement, SubmenuTriggerProps >(
	function MenuSubmenuTrigger(
		{ children, className, prefix, suffix, ...props },
		ref
	) {
		return (
			<_Menu.SubmenuTrigger
				ref={ ref }
				className={ clsx(
					resetStyles[ 'box-sizing' ],
					itemPopupStyles.item,
					styles.item,
					className
				) }
				{ ...props }
			>
				<ItemContent
					prefix={ prefix }
					suffix={
						<>
							{ suffix }
							<Icon
								icon={ chevronRightSmall }
								size={ 24 }
								aria-hidden="true"
							/>
						</>
					}
				>
					{ children }
				</ItemContent>
			</_Menu.SubmenuTrigger>
		);
	}
);

export { SubmenuTrigger };
