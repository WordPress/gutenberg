import { mergeProps, useRender } from '@base-ui/react';
import { forwardRef } from '@wordpress/element';
import styles from './style.module.css';
import type { TitleProps } from './types';

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
			// TODO: use `Text` component instead, when ready
			props: mergeProps< 'div' >( { className: styles.title }, props ),
		} );

		return element;
	}
);
