/**
 * External dependencies
 */
import { forwardRef, useEffect } from 'react';
import { Button as AriakitButton } from '@ariakit/react';
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { speak } from '@wordpress/a11y';

/**
 * Internal dependencies
 */
import { type ButtonProps } from './types';
import styles from './style.module.css';
import resetStyles from '../utils/css/resets.module.css';
import focusStyles from '../utils/css/focus.module.css';

/**
 * A versatile button component with multiple variants, tones, and sizes.
 * Built on design tokens for consistent theming and accessibility.
 */
export const Button = forwardRef< HTMLButtonElement, ButtonProps >(
	function Button(
		{
			tone = 'brand',
			variant = 'solid',
			size = 'default',
			className,
			accessibleWhenDisabled = true,
			disabled,
			loading,
			loadingAnnouncement,
			children,
			...props
		},
		ref
	) {
		const mergedClassName = clsx(
			resetStyles[ 'box-sizing' ],
			focusStyles[ 'outset-ring--focus-except-active' ],
			variant !== 'unstyled' && styles.button,
			styles[ `is-${ tone }` ],
			styles[ `is-${ variant }` ],
			styles[ `is-${ size }` ],
			loading && styles[ 'is-loading' ],
			className
		);

		// Announce loading state to assistive technology
		useEffect( () => {
			if ( loading && loadingAnnouncement ) {
				speak( loadingAnnouncement );
			}
		}, [ loading, loadingAnnouncement ] );

		return (
			<AriakitButton
				ref={ ref }
				className={ mergedClassName }
				accessibleWhenDisabled={ accessibleWhenDisabled }
				disabled={ disabled ?? loading }
				{ ...props }
			>
				{ children }
			</AriakitButton>
		);
	}
);
