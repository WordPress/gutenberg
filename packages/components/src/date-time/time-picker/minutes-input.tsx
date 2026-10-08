import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import type { ComponentProps } from 'react';
import NumberControl from '../../number-control';
import styles from './style.module.scss';

export const MinutesInput = forwardRef<
	HTMLInputElement,
	ComponentProps< typeof NumberControl >
>( function UnforwardedMinutesInput( { className, ...props }, ref ) {
	return (
		<NumberControl
			{ ...props }
			ref={ ref }
			className={ clsx( styles[ 'minutes-input' ], className ) }
		/>
	);
} );
