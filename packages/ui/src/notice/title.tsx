import { forwardRef } from '@wordpress/element';
import { useRender, mergeProps } from '@base-ui/react';
import type { TitleProps } from './types';
import styles from './style.module.css';

/**
 * A short heading that communicates the main message of the notice.
 */
export const Title = forwardRef< HTMLSpanElement, TitleProps >(
	function NoticeTitle( { render, ...props }, ref ) {
		const element = useRender( {
			defaultTagName: 'span',
			render,
			ref,
			props: mergeProps< 'span' >( { className: styles.title }, props ),
		} );

		return element;
	}
);
