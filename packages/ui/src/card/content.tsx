import { forwardRef } from 'react';
import { useRender, mergeProps } from '@base-ui/react';
import type { ContentProps } from './types';
import styles from './style.module.css';

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
