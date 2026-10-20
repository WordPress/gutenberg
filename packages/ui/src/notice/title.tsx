import { forwardRef } from '@wordpress/element';
import { useMergeRefs } from '@wordpress/compose';
import clsx from 'clsx';
import type { TitleProps } from './types';
import { Text } from '../text';
import styles from './style.module.css';
import { useNoticeText } from './context';

/**
 * A short heading that communicates the main message of the notice.
 */
export const Title = forwardRef< HTMLSpanElement, TitleProps >(
	function NoticeTitle( { className, ...props }, ref ) {
		const textRef = useNoticeText( 'title' );
		const mergedRef = useMergeRefs( [ ref, textRef ] );
		return (
			<Text
				ref={ mergedRef }
				variant="heading-md"
				className={ clsx( styles.title, className ) }
				{ ...props }
			/>
		);
	}
);
