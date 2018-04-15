/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
import { Component, Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { keycodes } from '@wordpress/utils';

/**
 * Internal dependencies
 */
import './style.scss';

/**
 * Module constants
 */
const { ESCAPE } = keycodes;

class SharedBlockEditPanel extends Component {
	constructor() {
		super( ...arguments );

		this.bindTitleRef = this.bindTitleRef.bind( this );
		this.handleFormSubmit = this.handleFormSubmit.bind( this );
		this.handleTitleChange = this.handleTitleChange.bind( this );
		this.handleTitleKeyDown = this.handleTitleKeyDown.bind( this );
	}

	componentDidMount() {
		if ( this.props.isEditing ) {
			this.titleRef.select();
		}
	}

	bindTitleRef( ref ) {
		this.titleRef = ref;
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
		const { isEditing, title, isSaving, onEdit, onSave, onCancel } = this.props;

		return (
			<Fragment>
				{ ( ! isEditing && ! isSaving ) && (
					<div className="shared-block-edit-panel">
						<b className="shared-block-edit-panel__info">
							{ title }
						</b>
						<Button isLarge className="shared-block-edit-panel__button" onClick={ onEdit }>
							{ __( 'Edit' ) }
						</Button>
					</div>
				) }
				{ ( isEditing || isSaving ) && (
					<form className="shared-block-edit-panel" onSubmit={ this.handleFormSubmit }>
						<input
							ref={ this.bindTitleRef }
							type="text"
							disabled={ isSaving }
							className="shared-block-edit-panel__title"
							value={ title }
							onChange={ this.handleTitleChange }
							onKeyDown={ this.handleTitleKeyDown }
						/>
						<Button
							type="submit"
							isPrimary
							isLarge
							isBusy={ isSaving }
							disabled={ ! title || isSaving }
							className="shared-block-edit-panel__button"
							onClick={ onSave }
						>
							{ __( 'Save' ) }
						</Button>
						<Button
							isLarge
							disabled={ isSaving }
							className="shared-block-edit-panel__button"
							onClick={ onCancel }
						>
							{ __( 'Cancel' ) }
						</Button>
					</form>
				) }
			</Fragment>
		);
	}
}

export default SharedBlockEditPanel;
