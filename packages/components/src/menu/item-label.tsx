import clsx from 'clsx';
import { forwardRef, useContext } from '@wordpress/element';
import type { WordPressComponentProps } from '../context';
import { Context } from './context';
import { Truncate } from '../truncate';
import styles from './style.module.scss';

export const ItemLabel = forwardRef<
	HTMLSpanElement,
	WordPressComponentProps< { children: React.ReactNode }, 'span', true >
>( function UnforwardedItemLabel( { className, ...props }, ref ) {
	const menuContext = useContext( Context );

	if ( ! menuContext?.store ) {
		throw new Error(
			'Menu.ItemLabel can only be rendered inside a Menu component'
		);
	}

	return (
		<Truncate
			numberOfLines={ 1 }
			ref={ ref }
			{ ...props }
			className={ clsx( styles[ 'item-label' ], className ) }
		/>
	);
} );
