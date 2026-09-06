import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import styles from './style.module.css';
import type { ItemDescriptionProps } from './types';
import { Text } from '../text';
import { useMenuItemContentContext } from './context';

/**
 * Renders supplementary text below a menu item label. Use it as a direct child
 * alongside `Menu.ItemLabel`.
 */
const ItemDescription = forwardRef< HTMLSpanElement, ItemDescriptionProps >(
	function MenuItemDescription( { className, id, ...props }, ref ) {
		const itemContentContext = useMenuItemContentContext();
		if (
			process.env.NODE_ENV !== 'production' &&
			( ! id || ! itemContentContext?.descriptionIds.includes( id ) )
		) {
			throw new Error(
				'Menu.ItemDescription: Missing direct menu item parent. Render <Menu.ItemDescription> as a direct child of a menu item.'
			);
		}

		return (
			<Text
				ref={ ref }
				variant="body-sm"
				{ ...props }
				id={ id }
				className={ clsx( styles[ 'item-description' ], className ) }
			/>
		);
	}
);

export { ItemDescription };
