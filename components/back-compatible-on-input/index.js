/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';

export default class BackCompatibleOnInput extends Component {
	constructor() {
		super( ...arguments );

		this.onInput = this.onInput.bind( this );
		this.onKeyUp = this.onKeyUp.bind( this );

		this.state = {
			isOnInputSupported: false,
		};
	}

	onInput( event ) {
		this.setState( {
			onInputSupported: true,
		} );
		this.props.onInput( event );
	}

	onKeyUp( event ) {
		if ( this.state.isOnInputSupported ) {
			return;
		}
		this.props.onInput( event );
	}

	render() {
		const { isOnInputSupported } = this.state;
		const { onInput, children, ...props } = this.props;
		return (
			<div
				onInput={ isOnInputSupported ? onInput : this.onInput }
				onKeyUp={ isOnInputSupported ? undefined : this.onKeyUp }
				{ ...props }
			>
				{ children }
			</div>
		);
	}
}
