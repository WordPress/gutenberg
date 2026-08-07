import { forwardRef, useEffect } from '@wordpress/element';
import clsx from 'clsx';
import type { DescriptionProps } from './types';
import { Text } from '../text';
import { useNoticeContext } from './context';
import styles from './style.module.css';

/**
 * The description text for a notice.
 */
export const Description = forwardRef< HTMLSpanElement, DescriptionProps >(
	function NoticeDescription( { className, children, ...props }, ref ) {
		const { setDescription } = useNoticeContext();

		useEffect( () => {
			setDescription( children );
			return () => setDescription( undefined );
		}, [ children, setDescription ] );

		return (
			<Text
				ref={ ref }
				variant="body-md"
				className={ clsx( styles.description, className ) }
				{ ...props }
			>
				{ children }
			</Text>
		);
	}
);
