import clsx from 'clsx';
import * as Ariakit from '@ariakit/react';
import { forwardRef, useContext } from '@wordpress/element';
import type { WordPressComponentProps } from '../context';
import { Context } from './context';
import { Text } from '../text';
import { CONFIG } from '../utils';
import type { GroupLabelProps } from './types';
import styles from './style.module.scss';

export const GroupLabel = forwardRef<
	HTMLDivElement,
	WordPressComponentProps< GroupLabelProps, 'div', false >
>( function Group( { className, ...props }, ref ) {
	const menuContext = useContext( Context );

	if ( ! menuContext?.store ) {
		throw new Error(
			'Menu.GroupLabel can only be rendered inside a Menu component'
		);
	}

	return (
		<Ariakit.MenuGroupLabel
			ref={ ref }
			render={
				// @ts-expect-error The `children` prop is passed
				<Text
					upperCase
					variant="muted"
					size="11px"
					weight={ CONFIG.fontWeightEmphasis }
					lineHeight="16px"
				/>
			}
			{ ...props }
			className={ clsx( styles[ 'group-label' ], className ) }
			store={ menuContext.store }
		/>
	);
} );
