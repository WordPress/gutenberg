import { forwardRef } from '@wordpress/element';
import clsx from 'clsx';
import type { TitleProps } from './types';
import { Text } from '../text';
import styles from './style.module.css';

/**
 * A short heading that communicates the main message of the notice.
 */
export const Title = forwardRef< HTMLSpanElement, TitleProps >(
	function NoticeTitle( { className, ...props }, ref ) {
		return (
			<Text
				ref={ ref }
				variant="heading-md"
				className={ clsx( styles.title, className ) }
				{ ...props }
			/>
		);
	}
);
