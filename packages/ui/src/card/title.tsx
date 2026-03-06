import { forwardRef } from 'react';
import { useRender, mergeProps } from '@base-ui/react';
import type { TitleProps } from './types';
import styles from './style.module.css';

/**
 * The title for a card. Renders as a `<div>` by default — use the `render`
 * prop to swap in a semantic heading element when appropriate.
 */
export const Title = forwardRef< HTMLDivElement, TitleProps >(
	function CardTitle( { render, ...props }, ref ) {
		const element = useRender( {
			defaultTagName: 'div',
			render,
			ref,
			props: mergeProps< 'div' >( { className: styles.title }, props ),
		} );

		return element;
	}
);
