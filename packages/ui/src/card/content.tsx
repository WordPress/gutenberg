import { mergeProps, useRender } from '@base-ui/react';
import { forwardRef } from '@wordpress/element';
import styles from './style.module.css';
import type { ContentProps } from './types';

/**
 * The main content area of the card.
 */
export const Content = forwardRef< HTMLDivElement, ContentProps >(
	function CardContent( { render, ...props }, ref ) {
		const element = useRender( {
			defaultTagName: 'div',
			render,
			ref,
			props: mergeProps< 'div' >( { className: styles.content }, props ),
		} );

		return element;
	}
);
