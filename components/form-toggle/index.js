/**
 * External dependencies
 */
import classNames from 'classnames';
import { noop } from 'lodash';

/**
 * WordPress dependencies
 */
import { Component } from 'element';

/**
 * Internal dependencies
 */
import './style.scss';

class FormToggle extends Component {
	constructor() {
		super( ...arguments );
		this.id = this.constructor.instances++;
	}

	render() {
		const { className, checked, children, onChange = noop } = this.props;
		const id = 'toggle-' + this.id;
		const wrapperClasses = classNames(
			'components-form-toggle',
			className,
			{ 'is-checked': checked }
		);

		return (
			<div className={ wrapperClasses }>
				<input
					className="components-form-toggle__input"
					id={ id }
					type="checkbox"
					value={ checked }
					onChange={ onChange }
				/>
				<label className="components-form-toggle__label" htmlFor={ id }>
					{ children }
				</label>
			</div>
		);
	}
}

FormToggle.instances = 1;

export default FormToggle;
