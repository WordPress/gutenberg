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
 * - As the **first child** of `Card.Header`, it extends flush to the card's
 *   top edge — ideal for hero images.
 * - As the **only child** of `Card.Content`, it extends flush to the card's
 *   top edge when `Content` is the first card section, and to the bottom edge
 *   when it is the last.
 *
 * Inter-sibling spacing inside `Card.Header` / `Card.Content` is consumer-
 * managed. To add space between a hero `FullBleed` and the following
 * siblings, compose the parent with `Stack` via the `render` prop:
 * `<Card.Header render={ <Stack direction="column" gap="lg" /> }>`. This
 * keeps `FullBleed` a direct child of `Card.Header` so the edge-bump still
 * fires, while `Stack` provides the gap.
 *
 * Inside `CollapsibleCard`, place full-bleed media in `CollapsibleCard.Content`
 * (not the header). The trigger/panel gap is preserved by design.
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
