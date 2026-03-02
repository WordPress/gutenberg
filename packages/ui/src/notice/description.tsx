import { forwardRef } from '@wordpress/element';
import clsx from 'clsx';
import type { DescriptionProps } from './types';
import { Text } from '../text';
import styles from './style.module.css';

/**
 * The description text for a notice.
 */
export const Description = forwardRef< HTMLDivElement, DescriptionProps >(
	function NoticeDescription( { className, children, ...props }, ref ) {
		return (
			<Text
				variant="body-md"
				render={ <div ref={ ref } { ...props } /> }
				className={ clsx( styles.description, className ) }
			>
				{ children }
			</Text>
		);
	}
);
