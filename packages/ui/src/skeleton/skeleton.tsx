import { useRender, mergeProps } from '@base-ui/react';
import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import { type SkeletonProps } from './types';
import styles from './style.module.css';

// Static map so the build-time token-fallback plugin can inject fallbacks.
const radiusTokens: Record<
	NonNullable< SkeletonProps[ 'radius' ] >,
	string
> = {
	none: '0',
	xs: 'var(--wpds-border-radius-xs)',
	sm: 'var(--wpds-border-radius-sm)',
	md: 'var(--wpds-border-radius-md)',
	lg: 'var(--wpds-border-radius-lg)',
	xl: 'var(--wpds-border-radius-xl)',
	full: '9999px',
};

/**
 * A placeholder shown while content is loading.
 */
export const Skeleton = forwardRef< HTMLDivElement, SkeletonProps >(
	function Skeleton(
		{ radius = 'md', animation = 'pulse', render, ...props },
		ref
	) {
		return useRender( {
			render,
			ref,
			props: mergeProps< 'div' >(
				{
					style: { borderRadius: radiusTokens[ radius ] },
					className: clsx( styles.skeleton, {
						[ styles.pulse ]: animation === 'pulse',
					} ),
					// Decorative by default; consumers mark the loading
					// region with aria-busy / role="status".
					'aria-hidden': true,
				},
				props
			),
		} );
	}
);
