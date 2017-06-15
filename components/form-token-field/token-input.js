/**
 * WordPress dependencies
 */
import { Component } from 'element';

class TokenInput extends Component {
	constructor() {
		super( ...arguments );
		this.onChange = this.onChange.bind( this );
		this.bindInput = this.bindInput.bind( this );
	}

	focus() {
		this.input.focus();
	}

	hasFocus() {
		return this.input === document.activeElement;
	}

	bindInput( ref ) {
		this.input = ref;
	}

	onChange( event ) {
		this.props.onChange( {
			value: event.target.value,
		} );
	}

	render() {
		const props = { ...this.props, onChange: this.onChange };
		const { value, placeholder } = props;
		const size = ( ( value.length === 0 && placeholder && placeholder.length ) || value.length ) + 1;

		return (
			<input
				ref={ this.bindInput }
				type="text"
				{ ...props }
				size={ size }
				className="components-form-token-field__input"
			/>
		);
	}
}

export default TokenInput;
