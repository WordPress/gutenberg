import { useRender, mergeProps } from '@base-ui/react';
import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { type LinkProps } from './types';
import styles from './style.module.css';

export const Link = forwardRef< HTMLAnchorElement, LinkProps >( function Link(
	{
		children,
		variant = 'default',
		tone = 'brand',
		openInNewTab = false,
		render,
		className,
		rel = '',
		onClick,
		target,
		...props
	},
	ref
) {
	const isInternalAnchor = !! props.href?.startsWith( '#' );

	const relParts = [
		...rel.split( ' ' ),
		...( openInNewTab ? [ 'noopener' ] : [] ),
	];
	const mergedRel =
		relParts.filter( Boolean ).length > 0
			? [ ...new Set( relParts.filter( Boolean ) ) ].join( ' ' )
			: undefined;

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
				variant !== 'unstyled' && styles.link,
				variant !== 'unstyled' && styles[ `is-${ tone }` ],
				variant === 'unstyled' && styles[ 'is-unstyled' ],
				openInNewTab && styles[ 'has-link-icon' ],
				className
			),
			rel: mergedRel,
			onClick: handleClick,
			target: openInNewTab ? '_blank' : target,
			children: openInNewTab ? (
				<>
					<span className={ styles[ 'link-contents' ] }>
						{ children }
					</span>
					<span
						className={ styles[ 'link-icon' ] }
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
