import { useRender, mergeProps } from '@base-ui/react';
import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { type LinkProps } from './types';
import resetStyles from '../utils/css/resets.module.css';
import focusStyles from '../utils/css/focus.module.css';
import styles from './style.module.css';

/**
 * A styled anchor element with support for semantic color tones and an
 * unstyled escape hatch.
 */
export const Link = forwardRef< HTMLAnchorElement, LinkProps >( function Link(
	{
		children,
		variant = 'default',
		tone = 'brand',
		openInNewTab = false,
		render,
		className,
		onClick,
		...props
	},
	ref
) {
	const isInternalAnchor = !! props.href?.startsWith( '#' );

	const handleClick = ( event: React.MouseEvent< HTMLAnchorElement > ) => {
		if ( openInNewTab && isInternalAnchor ) {
			event.preventDefault();
		}
		onClick?.( event );
	};

	const element = useRender( {
		render,
		defaultTagName: 'a',
		ref,
		props: mergeProps< 'a' >( props, {
			className: clsx(
				resetStyles[ 'box-sizing' ],
				focusStyles[ 'outset-ring--focus' ],
				variant !== 'unstyled' && styles.link,
				variant !== 'unstyled' && styles[ `is-${ tone }` ],
				variant === 'unstyled' && styles[ 'is-unstyled' ],
				openInNewTab && styles[ 'has-link-icon' ],
				className
			),
			onClick: handleClick,
			target: openInNewTab ? '_blank' : undefined,
			children: openInNewTab ? (
				<>
					<span className={ styles[ 'link-contents' ] }>
						{ children }
					</span>
					<span
						className={ styles[ 'link-icon' ] }
						role="img"
						aria-label={
							/* translators: accessibility text appended to link text */
							__( '(opens in a new tab)' )
						}
					/>
				</>
			) : (
				children
			),
		} ),
	} );

	return element;
} );
