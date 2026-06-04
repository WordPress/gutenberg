import { useRender, mergeProps } from '@base-ui/react';
import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import { type LinkButtonProps } from './types';
import buttonStyles from '../button/style.module.css';
import resetStyles from '../utils/css/resets.module.css';
import focusStyles from '../utils/css/focus.module.css';
import defenseStyles from '../utils/css/global-css-defense.module.css';

/**
 * A link that looks like a `Button`, for navigation actions.
 */
export const LinkButton = forwardRef< HTMLAnchorElement, LinkButtonProps >(
	function LinkButton(
		{
			tone = 'brand',
			variant = 'solid',
			size = 'default',
			className,
			disabled,
			children,
			render,
			onClick,
			onKeyDown,
			...props
		},
		ref
	) {
		const mergedClassName = clsx(
			defenseStyles.a,
			resetStyles[ 'box-sizing' ],
			focusStyles[ 'outset-ring--focus-except-active' ],
			variant !== 'unstyled' && buttonStyles.button,
			buttonStyles[ `is-${ tone }` ],
			buttonStyles[ `is-${ variant }` ],
			buttonStyles[ `is-${ size }` ],
			className
		);

		const element = useRender( {
			render,
			defaultTagName: 'a',
			ref,
			props: mergeProps< 'a' >( props, {
				className: mergedClassName,
				...( disabled && {
					'aria-disabled': true,
					'data-disabled': '',
					tabIndex: -1,
				} ),
				onClick( event ) {
					if ( disabled ) {
						event.preventDefault();
						return;
					}
					onClick?.( event );
				},
				onKeyDown( event ) {
					if (
						disabled &&
						( event.key === 'Enter' || event.key === ' ' )
					) {
						event.preventDefault();
						return;
					}
					onKeyDown?.( event );
				},
				children,
			} ),
		} );

		return element;
	}
);
