import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import { Text } from '../text';
import type { EmptyStateTitleProps } from './types';
import styles from './style.module.css';

/**
 * The title is a short heading that communicates the empty state.
 */
export const Title = forwardRef< HTMLHeadingElement, EmptyStateTitleProps >(
	function EmptyStateTitle( { render, className, children, ...props }, ref ) {
		return (
			<Text
				variant="heading-lg"
				// eslint-disable-next-line jsx-a11y/heading-has-content -- content provided via render prop
				render={ render ?? <h2 ref={ ref } { ...props } /> }
				className={ clsx( styles.title, className ) }
			>
				{ children }
			</Text>
		);
	}
);
