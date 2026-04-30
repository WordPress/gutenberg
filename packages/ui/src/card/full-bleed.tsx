import { mergeProps, useRender } from '@base-ui/react';
import { forwardRef } from '@wordpress/element';
import styles from './style.module.css';
import type { FullBleedProps } from './types';

/**
 * A container that breaks out of the card's padding to span edge-to-edge.
 * Useful for full-width images, dividers, or embedded content.
 *
 * When placed as the **first child** of `Card.Header`, the element also
 * extends flush to the card's top edge. The card's `overflow: clip` and
 * `border-radius` ensure the content is correctly clipped to the card's
 * rounded corners.
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
