import { forwardRef } from '@wordpress/element';
import { useMergeRefs } from '@wordpress/compose';
import clsx from 'clsx';
import type { DescriptionProps } from './types';
import { Text } from '../text';
import styles from './style.module.css';
import { useNoticeText } from './context';

/**
 * The description text for a notice.
 */
export const Description = forwardRef< HTMLSpanElement, DescriptionProps >(
	function NoticeDescription( { className, ...props }, ref ) {
		const textRef = useNoticeText( 'description' );
		const mergedRef = useMergeRefs( [ ref, textRef ] );
		return (
			<Text
				ref={ mergedRef }
				variant="body-md"
				className={ clsx( styles.description, className ) }
				{ ...props }
			/>
		);
	}
);
