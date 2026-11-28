import clsx from 'clsx';
import * as Ariakit from '@ariakit/react';
import { forwardRef, useContext } from '@wordpress/element';
import { chevronRightSmall } from '@wordpress/icons';
import { isRTL } from '@wordpress/i18n';
import type { WordPressComponentProps } from '../context';
import type { ItemProps } from './types';
import { Context } from './context';
import { Item } from './item';
import Icon from '../icon';
import styles from './style.module.scss';

export const SubmenuTriggerItem = forwardRef<
	HTMLDivElement,
	WordPressComponentProps< ItemProps, 'div', false >
>( function UnforwardedSubmenuTriggerItem( { suffix, ...otherProps }, ref ) {
	const menuContext = useContext( Context );

	if ( ! menuContext?.store.parent ) {
		throw new Error(
			'Menu.SubmenuTriggerItem can only be rendered inside a nested Menu component'
		);
	}

	return (
		<Ariakit.MenuButton
			ref={ ref }
			accessibleWhenDisabled
			store={ menuContext.store }
			render={
				<Item
					{ ...otherProps }
					// The menu item needs to register and be part of the parent menu.
					// Without specifying the store explicitly, the `Item` component
					// would otherwise read the store via context and pick up the one from
					// the sub-menu `Menu` component.
					store={ menuContext.store.parent }
					suffix={
						<>
							{ suffix }
							<Icon
								className={ clsx(
									styles[ 'submenu-chevron-icon' ],
									{ [ styles[ 'is-rtl' ] ]: isRTL() }
								) }
								aria-hidden="true"
								icon={ chevronRightSmall }
								size={ 24 }
								preserveAspectRatio="xMidYMid slice"
							/>
						</>
					}
				/>
			}
		/>
	);
} );
