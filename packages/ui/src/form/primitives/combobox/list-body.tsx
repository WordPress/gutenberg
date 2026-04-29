import { forwardRef } from '@wordpress/element';
import { mergeProps, useRender } from '@base-ui/react';
import type { ComboboxListBodyProps } from './types';
import itemPopupStyles from '../../../utils/css/item-popup.module.css';

/**
 * A layout container for the main scrolling area in the `List`, for holding `Item`s.
 */
export const ListBody = forwardRef< HTMLDivElement, ComboboxListBodyProps >(
	function ListBody( { render, ...props }, ref ) {
		const element = useRender( {
			defaultTagName: 'div',
			render,
			ref,
			props: mergeProps< 'div' >(
				{ className: itemPopupStyles[ 'list-scrollable-container' ] },
				props
			),
		} );

		return element;
	}
);
