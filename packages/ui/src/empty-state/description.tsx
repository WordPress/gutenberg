import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import { Text } from '../text';
import type { EmptyStateDescriptionProps } from './types';
import styles from './style.module.css';

const DEFAULT_TAG = <p />;

/**
 * The description text for an empty state, providing additional context and
 * guidance on what the user should do next.
 */
export const Description = forwardRef<
	HTMLParagraphElement,
	EmptyStateDescriptionProps
>( function EmptyStateDescription(
	{ render = DEFAULT_TAG, className, children, ...props },
	ref
) {
	return (
		<Text
			ref={ ref }
			variant="body-md"
			render={ render }
			className={ clsx( styles.description, className ) }
			{ ...props }
		>
			{ children }
		</Text>
	);
} );
