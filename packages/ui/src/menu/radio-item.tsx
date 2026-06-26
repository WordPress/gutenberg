import { Menu as _Menu } from '@base-ui/react/menu';
import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import itemPopupStyles from '../utils/css/item-popup.module.css';
import resetStyles from '../utils/css/resets.module.css';
import styles from './style.module.css';
import { ItemContent } from './item';
import type { RadioItemProps } from './types';

/**
 * Renders a menu item that works like a radio button in a group.
 */
const RadioItem = forwardRef< HTMLDivElement, RadioItemProps >(
	function MenuRadioItem(
		{ children, className, prefix, suffix, ...props },
		ref
	) {
		return (
			<_Menu.RadioItem
				ref={ ref }
				className={ clsx(
					resetStyles[ 'box-sizing' ],
					itemPopupStyles.item,
					styles.item,
					styles[ 'has-indicator' ],
					className
				) }
				{ ...props }
			>
				<ItemContent
					prefix={
						<>
							<_Menu.RadioItemIndicator
								keepMounted
								className={ styles[ 'item-indicator' ] }
							>
								<span
									className={ styles[ 'radio-indicator' ] }
									aria-hidden="true"
								/>
							</_Menu.RadioItemIndicator>
							{ prefix }
						</>
					}
					suffix={ suffix }
				>
					{ children }
				</ItemContent>
			</_Menu.RadioItem>
		);
	}
);

export { RadioItem };
