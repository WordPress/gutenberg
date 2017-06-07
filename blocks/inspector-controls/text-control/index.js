/**
 * WordPress dependencies
 */
import { Component } from 'element';

/**
 * Internal dependencies
 */
import './style.scss';

class TextControl extends Component {
	constructor() {
		super( ...arguments );
		this.instanceId = this.constructor.instances++;
	}

	render() {
		const { label, value, onChange } = this.props;
		const id = 'inspector-text-control-' + this.instanceId;
		const updateValue = ( event ) => onChange( event.target.value );

		return (
			<div className="blocks-text-control">
				<label className="blocks-text-control__label" htmlFor={ id }>{ label }</label>
				<input className="blocks-text-control__input" id={ id } value={ value } onChange={ updateValue } />
			</div>
		);
	}
}

TextControl.instances = 0;

export default TextControl;
