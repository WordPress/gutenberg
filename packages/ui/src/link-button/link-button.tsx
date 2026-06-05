import { useRender, mergeProps } from '@base-ui/react';
import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import { type LinkButtonProps } from './types';
import buttonStyles from '../button/style.module.css';
import resetStyles from '../utils/css/resets.module.css';
import focusStyles from '../utils/css/focus.module.css';
import defenseStyles from '../utils/css/global-css-defense.module.css';
import styles from './style.module.css';

/**
 * A link that looks like a `Button`. Prefer `Link` for navigation unless
 * button prominence is intentional.
 *
 * @see {@link https://wordpress.github.io/gutenberg/?path=/docs/design-system-components-button-usage-guidelines--docs When to use Button, Link, or LinkButton}
 */
export const LinkButton = forwardRef< HTMLAnchorElement, LinkButtonProps >(
	function LinkButton(
		{
			tone = 'brand',
			variant = 'solid',
			size = 'default',
			className,
			children,
			render,
			...props
		},
		ref
	) {
		const mergedClassName = clsx(
			defenseStyles[ 'link-button' ],
			styles[ 'link-button' ],
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
				children,
			} ),
		} );

		return element;
	}
);
