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
				! disabled && ! isBorderless && styles[ 'hover-border' ]
			) }
			disabled={ disabled }
			isBorderless={ isBorderless }
		/>
	);
}

const MemoizedBackdrop = memo( Backdrop );

export default MemoizedBackdrop;
