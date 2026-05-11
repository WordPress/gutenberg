import { forwardRef } from '@wordpress/element';
import clsx from 'clsx';
import type { DescriptionProps } from './types';
import { Text } from '../text';
import styles from './style.module.css';

/**
 * The description text for a notice.
 */
export const Description = forwardRef< HTMLSpanElement, DescriptionProps >(
	function NoticeDescription( { className, ...props }, ref ) {
		return (
			<Text
				ref={ ref }
				variant="body-md"
				className={ clsx( styles.description, className ) }
				{ ...props }
			/>
		);
	}
);
