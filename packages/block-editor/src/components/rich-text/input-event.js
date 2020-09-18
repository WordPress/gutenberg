/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';

export class __unstableRichTextInputEvent extends Component {
	constructor() {
		super( ...arguments );

		this.onInput = this.onInput.bind( this );
	}

	onInput( event ) {
		if ( event.inputType === this.props.inputType ) {
			this.props.onInput();
		}
	}

	componentDidMount() {
		document.addEventListener( 'input', this.onInput, true );
	}

	componentWillUnmount() {
		document.removeEventListener( 'input', this.onInput, true );
	}

	render() {
		return null;
	}
}
