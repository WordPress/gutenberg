import clsx from 'clsx';
import { memo } from '@wordpress/element';
import { BackdropUI } from './styles/input-control-styles';
import styles from './style.module.scss';

function Backdrop( { disabled = false, isBorderless = false } ) {
	return (
		<BackdropUI
			aria-hidden="true"
			className={ clsx(
				'components-input-control__backdrop',
				styles.border,
				disabled && styles[ 'is-disabled' ],
				isBorderless && styles[ 'is-borderless' ]
			) }
		/>
	);
}

const MemoizedBackdrop = memo( Backdrop );

export default MemoizedBackdrop;
