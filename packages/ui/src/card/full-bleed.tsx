import { forwardRef } from 'react';
import { useRender, mergeProps } from '@base-ui/react';
import type { FullBleedProps } from './types';
import styles from './style.module.css';

/**
 * A container that breaks out of the card's padding to span edge-to-edge.
 * Useful for full-width images, dividers, or embedded content.
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
