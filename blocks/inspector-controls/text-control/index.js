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
		this.onChange = this.onChange.bind( this );
	}

	onChange( event ) {
		this.props.onChange( event.target.value );
	}

	render() {
		const { label, value } = this.props;
		const id = 'inspector-text-control-' + this.instanceId;

		return (
			<div className="blocks-text-control">
				<label className="blocks-text-control__label" htmlFor={ id }>{ label }</label>
				<input className="blocks-text-control__input" id={ id } value={ value } onChange={ this.onChange } />
			</div>
		);
	}
}

TextControl.instances = 0;

export default TextControl;
