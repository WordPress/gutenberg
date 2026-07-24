import { forwardRef, useEffect } from '@wordpress/element';
import clsx from 'clsx';
import type { TitleProps } from './types';
import { Text } from '../text';
import { useNoticeContext } from './context';
import styles from './style.module.css';

/**
 * A short heading that communicates the main message of the notice.
 */
export const Title = forwardRef< HTMLSpanElement, TitleProps >(
	function NoticeTitle( { className, children, ...props }, ref ) {
		const { setTitle } = useNoticeContext();

		useEffect( () => {
			setTitle( children );
			return () => setTitle( undefined );
		}, [ children, setTitle ] );

		return (
			<Text
				ref={ ref }
				variant="heading-md"
				className={ clsx( styles.title, className ) }
				{ ...props }
			>
				{ children }
			</Text>
		);
	}
);
