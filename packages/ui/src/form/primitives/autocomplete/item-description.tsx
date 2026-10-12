import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import { Text } from '../../../text';
import itemPopupStyles from '../../../utils/css/item-popup.module.css';
import type { AutocompleteItemDescriptionProps } from './types';

const ITEM_DESCRIPTION_DIRECT_CHILD = Symbol();

type InternalItemDescriptionProps = AutocompleteItemDescriptionProps & {
	validationToken?: typeof ITEM_DESCRIPTION_DIRECT_CHILD;
};

/**
 * Supplementary content for an autocomplete item. Its text contributes to the
 * item's accessible description.
 */
const ForwardedItemDescription = forwardRef<
	HTMLSpanElement,
	AutocompleteItemDescriptionProps
>( function ItemDescription( props, ref ) {
	const { className, validationToken, ...restProps } =
		props as InternalItemDescriptionProps;
	if (
		process.env.NODE_ENV !== 'production' &&
		validationToken !== ITEM_DESCRIPTION_DIRECT_CHILD
	) {
		throw new Error(
			'Autocomplete.ItemDescription: Missing direct autocomplete item parent. Render <Autocomplete.ItemDescription> as a direct child of <Autocomplete.Item>.'
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
