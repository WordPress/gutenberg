import clsx from 'clsx';
import * as Ariakit from '@ariakit/react';
import { forwardRef, useContext } from '@wordpress/element';
import type { WordPressComponentProps } from '../context';
import { Context } from './context';
import type { SeparatorProps } from './types';
import styles from './style.module.scss';

export const Separator = forwardRef<
	HTMLHRElement,
	WordPressComponentProps< SeparatorProps, 'hr', false >
>( function UnforwardedSeparator( { className, ...props }, ref ) {
	const menuContext = useContext( Context );

	if ( ! menuContext?.store ) {
		throw new Error(
			'Menu.Separator can only be rendered inside a Menu component'
		);
	}

	return (
		<Ariakit.MenuSeparator
			ref={ ref }
			{ ...props }
			className={ clsx( styles.separator, className, {
				[ styles[ 'is-toolbar' ] ]: menuContext.variant === 'toolbar',
			} ) }
			store={ menuContext.store }
		/>
	);
} );
