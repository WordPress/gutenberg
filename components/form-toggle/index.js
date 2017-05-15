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

/**
 * Module constants
 */
const KEYCODE_ENTER = 13;
const KEYCODE_SPACE = 32;

class FormToggle extends Component {
	constructor() {
		super( ...arguments );

		this.onKeyDown = this.onKeyDown.bind( this );
		this.onClick = this.onClick.bind( this );
		this.onLabelClick = this.onLabelClick.bind( this );
	}

	componentWillMount() {
		this.id = this.constructor.instances++;
	}

	onKeyDown( event ) {
		const { disabled, onChange = noop, onKeyDown = noop } = this.props;
		if ( disabled ) {
			return;
		}

		if ( event.keyCode === KEYCODE_ENTER || event.key === KEYCODE_SPACE ) {
			event.preventDefault();
			onChange();
		}

		onKeyDown( event );
	}

	onClick() {
		const { disabled, onChange = noop } = this.props;
		if ( ! disabled ) {
			onChange();
		}
	}

	onLabelClick( event ) {
		const { disabled, onChange = noop } = this.props;
		if ( disabled ) {
			return;
		}

		const nodeName = event.target.nodeName.toLowerCase();
		if ( nodeName !== 'a' && nodeName !== 'input' && nodeName !== 'select' ) {
			event.preventDefault();
			onChange();
		}
	}

	render() {
		const id = 'toggle-' + this.id;
		const wrapperClasses = classNames( 'components-form-toggle__wrapper', {
			'is-disabled': this.props.disabled,
		} );
		const toggleClasses = classNames( 'components-form-toggle', this.props.className );

		// Disable reason: The "checkbox" input is simulated using onClick Events
		/* eslint-disable jsx-a11y/no-static-element-interactions, jsx-a11y/onclick-has-role, jsx-a11y/click-events-have-key-events */
		return (
			<span className={ wrapperClasses }>
				<input
					className={ toggleClasses }
					type="checkbox"
					checked={ this.props.checked }
					readOnly={ true }
					disabled={ this.props.disabled }
					/>
				<label className="components-form-toggle__label" htmlFor={ id } >
					<span className="components-form-toggle__switch"
						id={ id }
						onClick={ this.onClick }
						onKeyDown={ this.onKeyDown }
						role="checkbox"
						aria-checked={ this.props.checked }
						aria-label={ this.props[ 'aria-label' ] }
						tabIndex={ this.props.disabled ? -1 : 0 }
					/>
					<span className="components-form-toggle__label-content" onClick={ this.onLabelClick }>
						{ this.props.children }
					</span>
				</label>
			</span>
		);
		/* eslint-enable jsx-a11y/no-static-element-interactions, jsx-a11y/onclick-has-role, jsx-a11y/click-events-have-key-events */
	}
}

FormToggle.instances = 1;

export default FormToggle;
