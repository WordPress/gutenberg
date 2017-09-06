/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import './style.scss';

class NewReusableBlockDialog extends Component {
	constructor() {
		super( ...arguments );

		this.setName = this.setName.bind( this );
		this.create = this.create.bind( this );

		this.state = {
			name: '',
		};
	}

	setName( event ) {
		this.setState( { name: event.target.value } );
	}

	create( event ) {
		event.preventDefault();
		this.props.onCreate( this.state.name );
	}

	render() {
		return (
			<form className="blocks-new-reusable-block" onSubmit={ this.create }>
				<h4>{ __( 'Create Reusable Block' ) }</h4>
				<p>{ __( 'What would you like to call your reusable block?' ) }</p>
				<p>
					<input
						type="text"
						className="blocks-new-reusable-block__name-field"
						value={ this.state.name }
						onChange={ this.setName } />
				</p>
				<p className="blocks-new-reusable-block__buttons">
					<Button
						type="submit"
						className="blocks-new-reusable-block__button"
						isPrimary
						isLarge>
						{ __( 'Create' ) }
					</Button>
					<Button
						className="blocks-new-reusable-block__button"
						isLarge
						onClick={ this.props.onCancel }>
						{ __( 'Cancel' ) }
					</Button>
				</p>
			</form>
		);
	}
}

export default NewReusableBlockDialog;
