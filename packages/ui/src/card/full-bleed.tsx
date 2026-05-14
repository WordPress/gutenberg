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
 *   top edge — ideal for hero images. Siblings that follow (e.g. `Card.Title`)
 *   keep normal spacing below the bleed area.
 * - As the **only child** of `Card.Content`, it extends flush to the card's
 *   top edge when `Content` is the first **direct** child of `Card.Root`, and
 *   to the bottom edge when it is the last direct `Header`/`Content` section.
 *   (`CollapsibleCard` wraps content in a panel, so top-edge bumping does not
 *   apply there — the header/content gap stays intact.)
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
