/**
 * WordPress dependencies
 */
import { memo } from '@wordpress/element';
/**
 * Internal dependencies
 */
import { Fieldset, Legend, LegendText } from './styles/input-control-styles';

function Backdrop( {
	disabled = false,
	isFloating = false,
	isFloatingLabel = false,
	isFocused,
	label,
	size = 'default',
} ) {
	return (
		<Fieldset
			aria-hidden="true"
			className="components-input-control__backdrop"
			disabled={ disabled }
			isFloatingLabel={ isFloatingLabel }
			isFocused={ isFocused }
		>
			{ isFloatingLabel && (
				<Legend
					aria-hidden="true"
					className="components-input-control__backdrop-label"
					isFloating={ isFloating }
					size={ size }
				>
					<LegendText className="components-input-control__backdrop-text">
						{ label }
					</LegendText>
				</Legend>
			) }
		</Fieldset>
	);
}

const MemoizedBackdrop = memo( Backdrop );

export default MemoizedBackdrop;
