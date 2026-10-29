import clsx from 'clsx';
import { forwardRef, useContext } from '@wordpress/element';
import type { WordPressComponentProps } from '../context';
import { Context } from './context';
import { Truncate } from '../truncate';
import styles from './style.module.scss';

export const ItemHelpText = forwardRef<
	HTMLSpanElement,
	WordPressComponentProps< { children: React.ReactNode }, 'span', true >
>( function UnforwardedItemHelpText( { className, ...props }, ref ) {
	const menuContext = useContext( Context );

	if ( ! menuContext?.store ) {
		throw new Error(
			'Menu.ItemHelpText can only be rendered inside a Menu component'
		);
	}

	return (
		<Truncate
			numberOfLines={ 2 }
			ref={ ref }
			{ ...props }
			className={ clsx( styles[ 'item-help-text' ], className ) }
		/>
	);
} );
