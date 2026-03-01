import { forwardRef } from '@wordpress/element';
import { useRender, mergeProps } from '@base-ui/react';
import type { DescriptionProps } from './types';
import styles from './style.module.css';

/**
 * The description text for a notice.
 */
export const Description = forwardRef< HTMLDivElement, DescriptionProps >(
	function NoticeDescription( { render, ...props }, ref ) {
		const element = useRender( {
			defaultTagName: 'div',
			render,
			ref,
			props: mergeProps< 'div' >(
				{ className: styles.description },
				props
			),
		} );

		return element;
	}
);
