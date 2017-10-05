/**
 * WordPress dependencies
 */
import { Spinner, Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import './style.scss';

function ReusableBlockEditPanel( props ) {
	const { isEditing, name, isSaving, saveError, onEdit, onAttach, onChangeName, onSave, onCancel } = props;

	return (
		<div className="reusable-block-edit-panel">
			{ ! isEditing && [
				isSaving && <Spinner key="spinner" className="reusable-block-edit-panel__spinner" />,
				isSaving && (
					<span key="info" className="reusable-block-edit-panel__info">
						{ __( 'Saving…' ) }
					</span>
				),
				saveError && (
					<span key="info" className="reusable-block-edit-panel__info">
						{ saveError.message }
						&nbsp;
						<button className="button-link" onClick={ onSave }>{ __( 'Try again' ) }</button>
					</span>
				),
				! isSaving && ! saveError && (
					<span key="info" className="reusable-block-edit-panel__info">
						<b>{ name }</b>
					</span>
				),
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
					className="reusable-block-edit-panel__name"
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

