/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';

export class RichTextInputEvent extends Component {
	constructor() {
		super( ...arguments );

		this.onInput = this.onInput.bind( this );
	}

	onInput( event ) {
		this.props.onInput( event );
	}

	componentWillMount() {
		document.addEventListener( 'input', this.onInput, true );
	}

	componentWillUnmount() {
		document.removeEventListener( 'input', this.onInput, true );
	}

	render() {
		return null;
	}
}
