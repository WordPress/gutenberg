import { mergeProps, useRender } from '@base-ui/react';
import { forwardRef } from '@wordpress/element';
import type { AutocompleteListBodyProps } from './types';
import itemPopupStyles from '../../../utils/css/item-popup.module.css';

/**
 * A layout container for the main scrolling area in the `List`, for holding `Item`s.
 * In an inline list, give it a `max-height` so that the list scrolls on its own
 * and group labels stay pinned while their items scroll. It is out of the Tab
 * order by default, since the arrow keys move through the items from the input.
 * When the list scrolls, its items reach the scrollbar, so add an inline-end
 * padding to keep them apart, and `scrollbar-gutter: stable` to prevent width
 * changes when the scrollbar appears or disappears. Inside a padded container
 * such as a `Popover`, a negative inline-end margin of the same size moves the
 * scrollbar to the container's edge.
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
