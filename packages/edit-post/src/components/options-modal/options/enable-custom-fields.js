/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Notice, Button } from '@wordpress/components';
import { withSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import BaseOption from './base';

export function CustomFieldsConfirmation() {
	const [ isReloading, setIsReloading ] = useState( false );

	return (
		<div className="edit-post-options-modal__custom-fields-confirmation">
			<Notice status="warning" isDismissible={ false }>
				{ __( 'Page reload is required for this change.' ) }
			</Notice>
			<Button
				isDefault
				isBusy={ isReloading }
				disabled={ isReloading }
				onClick={ () => {
					setIsReloading( true );
					document.getElementById( 'toggle-custom-fields-form' ).submit();
				} }
			>
				{ __( 'Save & Reload' ) }
			</Button>
		</div>
	);
}

export function EnableCustomFieldsOption( { label, areCustomFieldsEnabled } ) {
	const [ isChecked, setIsChecked ] = useState( areCustomFieldsEnabled );

	return (
		<BaseOption
			label={ label }
			isChecked={ isChecked }
			onChange={ ( nextIsChecked ) => setIsChecked( nextIsChecked ) }
		>
			{ isChecked !== areCustomFieldsEnabled && <CustomFieldsConfirmation /> }
		</BaseOption>
	);
}

export default withSelect( ( select ) => ( {
	areCustomFieldsEnabled: !! select( 'core/editor' ).getEditorSettings().enableCustomFields,
} ) )( EnableCustomFieldsOption );
