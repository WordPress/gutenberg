import { mergeProps, useRender } from '@base-ui/react';
import { forwardRef } from '@wordpress/element';
import styles from './style.module.css';
import type { HeaderProps } from './types';

/**
 * A structural container for the card's heading area, typically containing
 * `Card.Title`.
 */
export const Header = forwardRef< HTMLDivElement, HeaderProps >(
	function CardHeader( { render, ...props }, ref ) {
		const element = useRender( {
			defaultTagName: 'div',
			render,
			ref,
			props: mergeProps< 'div' >( { className: styles.header }, props ),
		} );

		return element;
	}
);
