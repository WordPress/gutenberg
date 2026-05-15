import { mergeProps, useRender } from '@base-ui/react';
import { forwardRef } from '@wordpress/element';
import styles from './style.module.css';
import type { FullBleedProps } from './types';

/**
 * A container that breaks out of the card's padding to span edge-to-edge.
 * Useful for full-width images, dividers, or embedded content.
 *
 * Additional edge-bumping behavior based on placement:
 *
 * - As the **only child** of `Card.Content`, it extends flush to the card's
 *   top edge when `Content` is the first card section, and to the bottom edge
 *   when it is the last.
 *
 *   Note: inside `CollapsibleCard`, the panel that holds `Content` is a
 *   separate wrapper, so the top-edge bump does not apply — the gap between
 *   the trigger and the panel is preserved by design.
 *
 * With `CollapsibleCard`, place full-bleed media in `CollapsibleCard.Content`,
 * not the header.
 *
 * Must be used as a direct child of `Card.Content` or `Card.Header`.
 */
export const FullBleed = forwardRef< HTMLDivElement, FullBleedProps >(
	function CardFullBleed( { render, ...props }, ref ) {
		const element = useRender( {
			defaultTagName: 'div',
			render,
			ref,
			props: mergeProps< 'div' >(
				{ className: styles.fullbleed },
				props
			),
		} );

		return element;
	}
);
