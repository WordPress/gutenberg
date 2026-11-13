import { mergeProps, useRender } from '@base-ui/react';
import { forwardRef } from '@wordpress/element';
import type { AutocompleteListBodyProps } from './types';
import itemPopupStyles from '../../../utils/css/item-popup.module.css';

/**
 * A layout container for the main scrolling area in the `List`, for holding `Item`s.
 * In an inline list, give it a `max-height` so that the list scrolls on its own
 * and group labels stay pinned while their items scroll. It is out of the Tab
 * order by default, since the arrow keys move through the items from the input.
 *
 * When an inline list scrolls, its items reach the scrollbar. To keep them
 * clear of it, give the list body an inline-end padding. To keep the items'
 * width when the scrollbar appears or disappears, set `scrollbar-gutter: stable`.
 *
 * Inside a padded container such as a `Popover`, you can move the scrollbar to
 * the container's edge instead. Set the list body's inline-end padding to the
 * container's padding, and its inline-end margin to the negative of that value.
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
