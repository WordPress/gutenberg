import { useRender, mergeProps } from '@base-ui/react';
import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import { type SkeletonProps } from './types';
import resetStyles from '../utils/css/resets.module.css';
import styles from './style.module.css';

/**
 * A placeholder shown while content is loading.
 *
 * Size and corner radius are controlled via standard `div` props such as
 * `style` and `className`.
 */
export const Skeleton = forwardRef< HTMLDivElement, SkeletonProps >(
	function Skeleton( { render, ...props }, ref ) {
		return useRender( {
			render,
			ref,
			props: mergeProps< 'div' >(
				{
					className: clsx(
						styles.skeleton,
						styles.pulse,
						resetStyles[ 'box-sizing' ]
					),
					// Decorative by default; consumers mark the loading
					// region with aria-busy / role="status".
					'aria-hidden': true,
				},
				props
			),
		} );
	}
);
