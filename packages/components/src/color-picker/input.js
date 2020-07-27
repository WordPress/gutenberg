/**
 * External dependencies
 */
import { noop } from 'lodash';

/**
 * Internal dependencies
 */
import { ControlGroupItem } from '../control-group';
import InputControl from '../input-control';
import NumberControl from '../number-control';
import VisuallyHidden from '../visually-hidden';
import { isValidHex } from './utils';
import { LabelText } from './styles/color-picker-inputs-styles';

function Input( {
	value,
	valueKey,
	onChange = noop,
	source,
	label,
	labelText,
	type = 'number',
	...props
} ) {
	const commit = ( next = value ) => {
		onChange( {
			source,
			state: 'commit',
			value: next,
			valueKey,
		} );
	};

	const draft = ( next = value ) => {
		onChange( {
			source,
			state: 'draft',
			value: next,
			valueKey,
		} );
	};

	const handleOnBlur = () => commit();
	const handleOnPressEnter = () => commit();

	const handleOnChange = ( next ) => {
		if ( next.length > 4 && isValidHex( next ) ) {
			commit( next );
		} else {
			draft( next );
		}
	};

	const InputComponent = type === 'number' ? NumberControl : InputControl;

	return (
		<ControlGroupItem isBlock>
			<InputComponent
				className="components-color-picker__inputs-field"
				hideHTMLArrows
				label={
					<>
						<LabelText aria-hidden>{ labelText }</LabelText>
						<VisuallyHidden>{ label }</VisuallyHidden>
					</>
				}
				labelPosition="bottom"
				onBlur={ handleOnBlur }
				onChange={ handleOnChange }
				onPressEnter={ handleOnPressEnter }
				min="0"
				step="1"
				value={ value }
				{ ...props }
			/>
		</ControlGroupItem>
	);
}

export default Input;
