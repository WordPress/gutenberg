import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import { Text } from '../../../text';
import itemPopupStyles from '../../../utils/css/item-popup.module.css';
import type { ComboboxItemDescriptionProps } from './types';

const ITEM_DESCRIPTION_DIRECT_CHILD = Symbol();

type InternalItemDescriptionProps = ComboboxItemDescriptionProps & {
	validationToken?: typeof ITEM_DESCRIPTION_DIRECT_CHILD;
};

/**
 * Supplementary content for a combobox item. Its text contributes to the
 * item's accessible description. Use it as a direct child after
 * `Combobox.ItemLabel`. Content should be text or non-interactive inline markup.
 */
const ForwardedItemDescription = forwardRef<
	HTMLSpanElement,
	ComboboxItemDescriptionProps
>( function ItemDescription( props, ref ) {
	const { className, validationToken, ...restProps } =
		props as InternalItemDescriptionProps;
	if (
		process.env.NODE_ENV !== 'production' &&
		validationToken !== ITEM_DESCRIPTION_DIRECT_CHILD
	) {
		throw new Error(
			'ItemDescription: Missing direct item parent. Render ItemDescription as a direct child of Item.'
		);
	}

	return (
		<Text
			ref={ ref }
			variant="body-sm"
			className={ clsx(
				itemPopupStyles[ 'item-description' ],
				className
			) }
			{ ...restProps }
		/>
	);
} );

export {
	ITEM_DESCRIPTION_DIRECT_CHILD,
	ForwardedItemDescription as ItemDescription,
};
