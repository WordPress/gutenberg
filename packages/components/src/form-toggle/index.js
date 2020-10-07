/**
 * External dependencies
 */
import classnames from 'classnames';
import { noop } from 'lodash';

/**
 * Internal dependencies
 */
import {
	StyledFormToggle,
	StyledToggleTrack,
	StyledToggleInput,
	StyledToggleThumb,
} from './styles/form-toggle-styles';

function FormToggle( { className, checked, id, onChange = noop, ...props } ) {
	const wrapperClasses = classnames( 'components-form-toggle', className, {
		'is-checked': checked,
	} );

	return (
		<StyledFormToggle className={ wrapperClasses } isChecked={ checked }>
			<StyledToggleInput
				className="components-form-toggle__input"
				id={ id }
				type="checkbox"
				checked={ checked }
				onChange={ onChange }
				{ ...props }
			/>
			<StyledToggleTrack className="components-form-toggle__track" />
			<StyledToggleThumb className="components-form-toggle__thumb" />
		</StyledFormToggle>
	);
}

export default FormToggle;
