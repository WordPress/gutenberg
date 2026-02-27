import { useRender, mergeProps } from '@base-ui/react';
import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import { type LinkProps } from './types';
import styles from './style.module.css';

export const Link = forwardRef< HTMLAnchorElement, LinkProps >( function Link(
	{
		children,
		variant = 'default',
		tone = 'brand',
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
				variant !== 'unstyled' && styles.link,
				variant !== 'unstyled' && styles[ `is-${ tone }` ],
				variant === 'unstyled' && styles[ 'is-unstyled' ],
				className
			),
			children,
		} ),
	} );

	return element;
} );
