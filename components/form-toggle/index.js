/**
 * External dependencies
 */
import classNames from 'classnames';
import { noop } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from 'i18n';
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
		const {
			className,
			checked,
			onChange = noop,
			showHint = true,
			id = 'toggle-' + this.id,
		} = this.props;

		const wrapperClasses = classNames(
			'components-form-toggle',
			className,
			{ 'is-checked': checked }
		);

		return (
			<span className={ wrapperClasses }>
				<input
					className="components-form-toggle__input"
					id={ id }
					type="checkbox"
					value={ checked }
					onChange={ onChange }
				/>
				{ showHint &&
					<span className="components-form-toggle__hint" aria-hidden>
						{ checked ? __( 'On' ) : __( 'Off' ) }
					</span>
				}
			</span>
		);
	}
}

FormToggle.instances = 1;

export default FormToggle;
