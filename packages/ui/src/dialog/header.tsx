/**
 * External dependencies
 */
import { forwardRef } from 'react';
import clsx from 'clsx';

/**
 * Internal dependencies
 */
import { type HeaderProps } from './types';
import styles from './style.module.css';

const Header = forwardRef< HTMLDivElement, HeaderProps >( function DialogHeader(
	{ className, ...props },
	ref
) {
	return (
		<div
			ref={ ref }
			className={ clsx( styles.header, className ) }
			{ ...props }
		/>
	);
} );

export { Header };
