/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import './style.scss';

function ReusableBlockEditPanel( { isEditing, name, onEdit, onAttach, onChangeName, onSave, onCancel } ) {
	return (
		<div className="reusable-block-edit-panel">
			{ ! isEditing && [
				<span key="name" className="reusable-block-edit-panel__name-label">{ name }</span>,
				<Button
					key="edit"
					isLarge
					className="reusable-block-edit-panel__button"
					onClick={ onEdit }>
					{ __( 'Edit' ) }
				</Button>,
				<Button
					key="attach"
					isLarge
					className="reusable-block-edit-panel__button"
					onClick={ onAttach }>
					{ __( 'Detach' ) }
				</Button>,
			] }
			{ isEditing && [
				<input
					key="name"
					type="text"
					className="reusable-block-edit-panel__name-field"
					value={ name }
					onChange={ ( event ) => onChangeName( event.target.value ) } />,
				<Button
					key="save"
					isPrimary
					isLarge
					disabled={ ! name }
					className="reusable-block-edit-panel__button"
					onClick={ onSave }>
					{ __( 'Save' ) }
				</Button>,
				<Button
					key="cancel"
					isLarge
					className="reusable-block-edit-panel__button"
					onClick={ onCancel }>
					{ __( 'Cancel' ) }
				</Button>,
			] }
		</div>
	);
}

export default ReusableBlockEditPanel;

