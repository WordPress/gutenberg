import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import { Text } from '../text';
import type { EmptyStateDescriptionProps } from './types';
import styles from './style.module.css';

/**
 * The description text for an empty state, providing additional context and
 * guidance on what the user should do next.
 */
export const Description = forwardRef<
	HTMLParagraphElement,
	EmptyStateDescriptionProps
>( function EmptyStateDescription(
	{ render, className, children, ...props },
	ref
) {
	return (
		<Text
			variant="body-md"
			render={ render ?? <p ref={ ref } { ...props } /> }
			className={ clsx( styles.description, className ) }
		>
			{ children }
		</Text>
	);
} );
