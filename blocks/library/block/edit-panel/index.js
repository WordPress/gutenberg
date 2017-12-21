/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import './style.scss';

function ReusableBlockEditPanel( props ) {
	const { isEditing, title, isSaving, onEdit, onChangeTitle, onSave, onCancel } = props;

	return (
		<div className="reusable-block-edit-panel">
			{ ! isEditing && ! isSaving && [
				<span key="info" className="reusable-block-edit-panel__info">
					<b>{ title }</b>
				</span>,
				<Button
					key="edit"
					isLarge
					className="reusable-block-edit-panel__button"
					onClick={ onEdit }>
					{ __( 'Edit' ) }
				</Button>,
			] }
			{ ( isEditing || isSaving ) && [
				<input
					key="title"
					type="text"
					disabled={ isSaving }
					className="reusable-block-edit-panel__title"
					value={ title }
					onChange={ ( event ) => onChangeTitle( event.target.value ) } />,
				<Button
					key="save"
					isPrimary
					isLarge
					isBusy={ isSaving }
					disabled={ ! title || isSaving }
					className="reusable-block-edit-panel__button"
					onClick={ onSave }>
					{ __( 'Save' ) }
				</Button>,
				<Button
					key="cancel"
					isLarge
					disabled={ isSaving }
					className="reusable-block-edit-panel__button"
					onClick={ onCancel }>
					{ __( 'Cancel' ) }
				</Button>,
			] }
		</div>
	);
}

export default ReusableBlockEditPanel;

