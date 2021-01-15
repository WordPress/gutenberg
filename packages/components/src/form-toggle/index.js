/**
 * External dependencies
 */
import classnames from 'classnames';
import { noop } from 'lodash';
/**
 * Internal dependencies
 */
import Disabled from '../disabled';

function FormToggle( {
	className,
	checked,
	id,
	disabled,
	onChange = noop,
	...props
} ) {
	const wrapperClasses = classnames( 'components-form-toggle', className, {
		'is-checked': checked,
	} );

	const formToggleInput = (
		<span className={ wrapperClasses }>
			<input
				className="components-form-toggle__input"
				id={ id }
				type="checkbox"
				checked={ checked }
				onChange={ onChange }
				{ ...props }
			/>
			<span className="components-form-toggle__track"></span>
			<span className="components-form-toggle__thumb"></span>
		</span>
	);

	return disabled ? (
		<Disabled>{ formToggleInput }</Disabled>
	) : (
		formToggleInput
	);
}

export default FormToggle;
