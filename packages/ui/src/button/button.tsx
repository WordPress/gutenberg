import { Button as AriakitButton } from '@ariakit/react';
import clsx from 'clsx';
import { speak } from '@wordpress/a11y';
import { forwardRef, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { type ButtonProps } from './types';
import styles from './style.module.css';
import resetStyles from '../utils/css/resets.module.css';
import focusStyles from '../utils/css/focus.module.css';

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
			loadingAnnouncement = __( 'Loading' ),
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
