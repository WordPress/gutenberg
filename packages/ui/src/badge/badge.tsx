import { mergeProps } from '@base-ui/react';
import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import { type BadgeProps } from './types';
import styles from './style.module.css';
import { Text } from '../text';

/**
 * A badge component for displaying labels with semantic intent.
 */
export const Badge = forwardRef< HTMLSpanElement, BadgeProps >( function Badge(
	{ children, intent = 'none', render, className, ...props },
	ref
) {
	return (
		<Text
			variant="body-sm"
			render={
				render ?? (
					<span
						ref={ ref }
						{ ...mergeProps( props, {
							className: clsx(
								styles.badge,
								styles[ `is-${ intent }-intent` ],
								className
							),
						} ) }
					/>
				)
			}
		>
			{ children }
		</Text>
	);
} );
