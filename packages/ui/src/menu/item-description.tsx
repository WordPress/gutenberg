import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import styles from './style.module.css';
import type { ItemDescriptionProps } from './types';
import { Text } from '../text';

const ITEM_DESCRIPTION_DIRECT_CHILD = Symbol();

type InternalItemDescriptionProps = ItemDescriptionProps & {
	validationToken?: typeof ITEM_DESCRIPTION_DIRECT_CHILD;
};

/**
 * Renders supplementary text below a menu item label. Use it as a direct child
 * alongside `Menu.ItemLabel`.
 */
const ItemDescription = forwardRef< HTMLSpanElement, ItemDescriptionProps >(
	function MenuItemDescription( props, ref ) {
		const { className, id, validationToken, ...restProps } =
			props as InternalItemDescriptionProps;
		if (
			process.env.NODE_ENV !== 'production' &&
			validationToken !== ITEM_DESCRIPTION_DIRECT_CHILD
		) {
			throw new Error(
				'Menu.ItemDescription: Missing direct menu item parent. Render <Menu.ItemDescription> as a direct child of a menu item.'
			);
		}

		return (
			<Text
				ref={ ref }
				variant="body-sm"
				{ ...restProps }
				id={ id }
				className={ clsx( styles[ 'item-description' ], className ) }
			/>
		);
	}
);

export { ITEM_DESCRIPTION_DIRECT_CHILD, ItemDescription };
