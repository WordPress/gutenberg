/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';

export class NewReusableBlockDialog extends Component {
	constructor() {
		super( ...arguments );

		this.setName = this.setName.bind( this );

		this.state = {
			name: '',
		};
	}

	setName( event ) {
		this.setState( { name: event.target.value } );
	}

	render() {
		return (
			<div>
				<p>What would you like to name this reusable block?</p>
				<input type="text" value={ this.state.name } onChange={ this.setName } />
				<button onClick={ () => this.props.onCreate( this.state.name ) }>Create</button>
				<button onClick={ this.props.onCancel }>Cancel</button>
			</div>
		);
	}
}

export function SaveConfirmationDialog( { onConfirm, onCancel } ) {
	return (
		<div>
			<p>These changes will appear everywhere. Is that OK?</p>
			<button onClick={ onConfirm }>Edit across all instances</button>
			<button onClick={ onCancel }>Convert to regular block</button>
		</div>
	);
}
