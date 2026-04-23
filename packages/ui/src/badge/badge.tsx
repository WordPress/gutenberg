import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import { type BadgeProps } from './types';
import styles from './style.module.css';
import { Text } from '../text';

/**
 * A badge component for displaying labels with semantic intent.
 */
export const Badge = forwardRef< HTMLSpanElement, BadgeProps >( function Badge(
	{ intent = 'none', className, ...props },
	ref
) {
	return (
		<Text
			ref={ ref }
			className={ clsx(
				styles.badge,
				styles[ `is-${ intent }-intent` ],
				className
			) }
			{ ...props }
			variant="body-sm"
		/>
	);
} );
