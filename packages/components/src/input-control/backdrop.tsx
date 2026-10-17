import clsx from 'clsx';
import { memo } from '@wordpress/element';
import styles from './style.module.scss';

function Backdrop( { disabled = false, isBorderless = false } ) {
	return (
		<div
			aria-hidden="true"
			className={ clsx(
				'components-input-control__backdrop',
				styles.border,
				styles.backdrop,
				disabled && styles[ 'is-disabled' ],
				isBorderless && styles[ 'is-borderless' ]
			) }
		/>
	);
}

const MemoizedBackdrop = memo( Backdrop );

export default MemoizedBackdrop;
