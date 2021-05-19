/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';

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
		return this.input === this.input.ownerDocument.activeElement;
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
		const {
			value,
			isExpanded,
			instanceId,
			selectedSuggestionIndex,
			className,
			...props
		} = this.props;
		const size = value ? value.length + 1 : 0;

		return (
			<input
				ref={ this.bindInput }
				id={ `components-form-token-input-${ instanceId }` }
				type="text"
				{ ...props }
				value={ value || '' }
				onChange={ this.onChange }
				size={ size }
				className={ classnames(
					className,
					'components-form-token-field__input'
				) }
				autoComplete="off"
				role="combobox"
				aria-expanded={ isExpanded }
				aria-autocomplete="list"
				aria-owns={
					isExpanded
						? `components-form-token-suggestions-${ instanceId }`
						: undefined
				}
				aria-activedescendant={
					selectedSuggestionIndex !== -1
						? `components-form-token-suggestions-${ instanceId }-${ selectedSuggestionIndex }`
						: undefined
				}
				aria-describedby={ `components-form-token-suggestions-howto-${ instanceId }` }
			/>
		);
	}
}

export default TokenInput;
