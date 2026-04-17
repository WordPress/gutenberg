import { Menu as BaseMenu } from '@base-ui/react/menu';
import { Icon, chevronRightSmall } from '@wordpress/icons';
import { forwardRef } from '@wordpress/element';
import clsx from 'clsx';
import { ItemContent } from './item-content';
import type { MenuSubmenuTriggerProps } from './types';
import styles from './styles.module.css';

const SubmenuTriggerItem = forwardRef<
	HTMLDivElement,
	MenuSubmenuTriggerProps
>( ( { className, children, suffix, ...props }, ref ) => (
	<BaseMenu.SubmenuTrigger
		ref={ ref }
		className={ clsx( styles.item, className ) }
		{ ...props }
	>
		<div className={ styles.prefix } />
		<ItemContent
			suffix={
				<>
					{ suffix }
					<Icon
						icon={ chevronRightSmall }
						size={ 24 }
						className={ styles.submenuChevron }
					/>
				</>
			}
		>
			{ children }
		</ItemContent>
	</BaseMenu.SubmenuTrigger>
) );
SubmenuTriggerItem.displayName = 'Menu.SubmenuTriggerItem';

export { SubmenuTriggerItem };
