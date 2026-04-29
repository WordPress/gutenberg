import { forwardRef } from '@wordpress/element';
import { mergeProps, useRender } from '@base-ui/react';
import type { ComboboxListFooterProps } from './types';
import itemPopupStyles from '../../../utils/css/item-popup.module.css';

/**
 * A layout container for the footer row in the `List`,
 * for holding a single `Item` that triggers the creation of a new item.
 */
export const ListFooter = forwardRef< HTMLDivElement, ComboboxListFooterProps >(
	function ListFooter( { render, ...props }, ref ) {
		const element = useRender( {
			defaultTagName: 'div',
			render,
			ref,
			props: mergeProps< 'div' >(
				{ className: itemPopupStyles[ 'list-footer' ] },
				props
			),
		} );

		return element;
	}
);
