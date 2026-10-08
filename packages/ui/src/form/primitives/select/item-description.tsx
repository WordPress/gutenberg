import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import { Text } from '../../../text';
import itemPopupStyles from '../../../utils/css/item-popup.module.css';
import type { SelectItemDescriptionProps } from './types';

const ITEM_DESCRIPTION_DIRECT_CHILD = Symbol();

type InternalItemDescriptionProps = SelectItemDescriptionProps & {
	validationToken?: typeof ITEM_DESCRIPTION_DIRECT_CHILD;
};

/**
 * Supplementary content for a select item. Its text contributes to the item's
 * accessible description. Use it as a direct child after `Select.ItemLabel`.
 * Content should be text or non-interactive inline markup.
 */
const ItemDescription = forwardRef<
	HTMLSpanElement,
	SelectItemDescriptionProps
>( function UnforwardedItemDescription( props, ref ) {
	const { className, validationToken, ...restProps } =
		props as InternalItemDescriptionProps;
	if (
		process.env.NODE_ENV !== 'production' &&
		validationToken !== ITEM_DESCRIPTION_DIRECT_CHILD
	) {
		throw new Error(
			'Select.ItemDescription: Missing direct select item parent. Render <Select.ItemDescription> as a direct child of <Select.Item>.'
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

export { ITEM_DESCRIPTION_DIRECT_CHILD, ItemDescription };
