/**
 * WordPress dependencies
 */
import { memo } from '@wordpress/element';
/**
 * Internal dependencies
 */
import { BackdropUI } from './styles/input-control-styles';

function Backdrop( {
	disabled = false,
	isBorderless = false,
	isFocused = false,
} ) {
	return (
		<BackdropUI
			aria-hidden="true"
			className="components-input-control__backdrop"
			disabled={ disabled }
			isBorderless={ isBorderless }
			isFocused={ isFocused }
		/>
	);
}

const MemoizedBackdrop = memo( Backdrop );

export default MemoizedBackdrop;
