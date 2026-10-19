import clsx from 'clsx';
import * as Ariakit from '@ariakit/react';
import { forwardRef, useContext } from '@wordpress/element';
import type { WordPressComponentProps } from '../context';
import { Context } from './context';
import type { GroupProps } from './types';
import styles from './style.module.scss';

export const Group = forwardRef<
	HTMLDivElement,
	WordPressComponentProps< GroupProps, 'div', false >
>( function UnforwardedGroup( { className, ...props }, ref ) {
	const menuContext = useContext( Context );

	if ( ! menuContext?.store ) {
		throw new Error(
			'Menu.Group can only be rendered inside a Menu component'
		);
	}

	return (
		<Ariakit.MenuGroup
			ref={ ref }
			{ ...props }
			className={ clsx( styles.group, className ) }
			store={ menuContext.store }
		/>
	);
} );
