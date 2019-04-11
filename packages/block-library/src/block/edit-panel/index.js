/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
import { Component, Fragment, createRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { ESCAPE } from '@wordpress/keycodes';
import { withInstanceId } from '@wordpress/compose';

class ReusableBlockEditPanel extends Component {
	constructor() {
		super( ...arguments );

		this.titleField = createRef();
		this.editButton = createRef();
		this.handleFormSubmit = this.handleFormSubmit.bind( this );
		this.handleTitleChange = this.handleTitleChange.bind( this );
		this.handleTitleKeyDown = this.handleTitleKeyDown.bind( this );
	}

	componentDidMount() {
		// Select the input text when the form opens.
		if ( this.props.isEditing && this.titleField.current ) {
			this.titleField.current.select();
		}
	}

	componentDidUpdate( prevProps ) {
		// Select the input text only once when the form opens.
		if ( ! prevProps.isEditing && this.props.isEditing ) {
			this.titleField.current.select();
		}
		// Move focus back to the Edit button after pressing the Escape key or Save.
		if ( ( prevProps.isEditing || prevProps.isSaving ) && ! this.props.isEditing && ! this.props.isSaving ) {
			this.editButton.current.focus();
		}
	}

	handleFormSubmit( event ) {
		event.preventDefault();
		this.props.onSave();
	}

	handleTitleChange( event ) {
		this.props.onChangeTitle( event.target.value );
	}

	handleTitleKeyDown( event ) {
		if ( event.keyCode === ESCAPE ) {
			event.stopPropagation();
			this.props.onCancel();
		}
	}

	render() {
		const { isEditing, title, isSaving, isEditDisabled, onEdit, instanceId } = this.props;

		return (
			<Fragment>
				{ ( ! isEditing && ! isSaving ) && (
					<div className="reusable-block-edit-panel">
						<b className="reusable-block-edit-panel__info">
							{ title }
						</b>
						<Button
							ref={ this.editButton }
							isLarge
							className="reusable-block-edit-panel__button"
							disabled={ isEditDisabled }
							onClick={ onEdit }
						>
							{ __( 'Edit' ) }
						</Button>
					</div>
				) }
				{ ( isEditing || isSaving ) && (
					<form className="reusable-block-edit-panel" onSubmit={ this.handleFormSubmit }>
						<label
							htmlFor={ `reusable-block-edit-panel__title-${ instanceId }` }
							className="reusable-block-edit-panel__label"
						>
							{ __( 'Name:' ) }
						</label>
						<input
							ref={ this.titleField }
							type="text"
							disabled={ isSaving }
							className="reusable-block-edit-panel__title"
							value={ title }
							onChange={ this.handleTitleChange }
							onKeyDown={ this.handleTitleKeyDown }
							id={ `reusable-block-edit-panel__title-${ instanceId }` }
						/>
						<Button
							type="submit"
							isLarge
							isBusy={ isSaving }
							disabled={ ! title || isSaving }
							className="reusable-block-edit-panel__button"
						>
							{ __( 'Save' ) }
						</Button>
					</form>
				) }
			</Fragment>
		);
	}
}

export default withInstanceId( ReusableBlockEditPanel );
