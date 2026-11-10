import { mergeProps, useRender } from '@base-ui/react';
import { forwardRef } from '@wordpress/element';
import type { AutocompleteListBodyProps } from './types';
import itemPopupStyles from '../../../utils/css/item-popup.module.css';

/**
 * A layout container for the main scrolling area in the `List`, for holding `Item`s.
 * In an inline list, give it a `max-height` so that the list scrolls on its own
 * and group labels stay pinned while their items scroll. It is out of the Tab
 * order by default, since the arrow keys move through the items from the input.
 */
export const ListBody = forwardRef< HTMLDivElement, AutocompleteListBodyProps >(
	function UnforwardedListBody( { render, ...props }, ref ) {
		const element = useRender( {
			defaultTagName: 'div',
			render,
			ref,
			props: mergeProps< 'div' >(
				{
					className: itemPopupStyles[ 'list-scrollable-container' ],
					tabIndex: -1,
				},
				props
			),
		} );

		return element;
	}
);
