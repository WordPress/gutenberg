/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { keycodes } from '@wordpress/utils';

/**
 * Internal dependencies
 */
import './style.scss';

const { ESCAPE } = keycodes;

function ReusableBlockEditPanel( props ) {
	const { isEditing, title, isSaving, onEdit, onChangeTitle, onSave, onCancel } = props;

	return [
		( ! isEditing && ! isSaving ) && (
			<div key="view" className="reusable-block-edit-panel">
				<span className="reusable-block-edit-panel__info">
					<b>{ title }</b>
				</span>
				<Button
					isLarge
					className="reusable-block-edit-panel__button"
					onClick={ onEdit }>
					{ __( 'Edit' ) }
				</Button>
			</div>
		),
		( isEditing || isSaving ) && (
			<form
				key="edit"
				className="reusable-block-edit-panel"
				onSubmit={ ( event ) => {
					event.preventDefault();
					onSave();
				} }>
				<input
					type="text"
					disabled={ isSaving }
					className="reusable-block-edit-panel__title"
					value={ title }
					onChange={ ( event ) => onChangeTitle( event.target.value ) }
					onKeyDown={ ( event ) => {
						if ( event.keyCode === ESCAPE ) {
							event.stopPropagation();
							onCancel();
						}
					} } />
				<Button
					type="submit"
					isPrimary
					isLarge
					isBusy={ isSaving }
					disabled={ ! title || isSaving }
					className="reusable-block-edit-panel__button"
					onClick={ onSave }>
					{ __( 'Save' ) }
				</Button>
				<Button
					isLarge
					disabled={ isSaving }
					className="reusable-block-edit-panel__button"
					onClick={ onCancel }>
					{ __( 'Cancel' ) }
				</Button>
			</form>
		),
	];
}

export default ReusableBlockEditPanel;

