import { forwardRef } from 'react';
import { useRender, mergeProps } from '@base-ui/react';
import type { HeaderProps } from './types';
import styles from './style.module.css';

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
