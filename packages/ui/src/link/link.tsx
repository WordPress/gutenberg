import { useRender, mergeProps } from '@base-ui/react';
import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { type LinkProps } from './types';
import resetStyles from '../utils/css/resets.module.css';
import focusStyles from '../utils/css/focus.module.css';
import styles from './style.module.css';
import defenseStyles from '../utils/css/global-css-defense.module.css';

/**
 * A styled anchor element with support for semantic color tones and an
 * unstyled escape hatch.
 *
 * See the [Usage Guidelines](https://wordpress.github.io/gutenberg/?path=/docs/design-system-components-button-usage-guidelines--docs)
 * for when to use `Button`, `IconButton`, `Link`, or `LinkButton`.
 */
export const Link = forwardRef< HTMLAnchorElement, LinkProps >( function Link(
	{
		children,
		variant = 'default',
		tone = 'brand',
		openInNewTab = false,
		render,
		className,
		...props
	},
	ref
) {
	const element = useRender( {
		render,
		defaultTagName: 'a',
		ref,
		props: mergeProps< 'a' >( props, {
			className: clsx(
				defenseStyles.a,
				resetStyles[ 'box-sizing' ],
				focusStyles[ 'outset-ring--focus-except-active' ],
				variant !== 'unstyled' && styles.link,
				variant !== 'unstyled' && styles[ `is-${ tone }` ],
				variant === 'unstyled' && styles[ 'is-unstyled' ],
				className
			),
			target: openInNewTab ? '_blank' : undefined,
			children: (
				<>
					{ children }
					{ openInNewTab && (
						<span
							className={ styles[ 'link-icon' ] }
							role="img"
							aria-label={
								/* translators: accessibility text appended to link text */
								__( '(opens in a new tab)' )
							}
						/>
					) }
				</>
			),
		} ),
	} );

	return element;
} );
