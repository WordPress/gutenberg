/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Button } from '@wordpress/components';
import { withSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { privateApis as preferencesPrivateApis } from '@wordpress/preferences';
import { getPathAndQueryString } from '@wordpress/url';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';

const { PreferenceBaseOption } = unlock( preferencesPrivateApis );

function submitCustomFieldsForm() {
	const customFieldsForm = document.getElementById(
		'toggle-custom-fields-form'
	);

	// Ensure the referrer values is up to update with any
	customFieldsForm
		.querySelector( '[name="_wp_http_referer"]' )
		.setAttribute( 'value', getPathAndQueryString( window.location.href ) );

	customFieldsForm.submit();
}

export function CustomFieldsConfirmation( { willEnable } ) {
	const [ isReloading, setIsReloading ] = useState( false );
	return (
		<>
			<p className="edit-post-preferences-modal__custom-fields-confirmation-message">
				{ __(
					'A page reload is required for this change. Make sure your content is saved before reloading.'
				) }
			</p>
			<Button
				// TODO: Switch to `true` (40px size) if possible
				__next40pxDefaultSize={ false }
				className="edit-post-preferences-modal__custom-fields-confirmation-button"
				variant="secondary"
				isBusy={ isReloading }
				accessibleWhenDisabled
				disabled={ isReloading }
				onClick={ () => {
					setIsReloading( true );
					submitCustomFieldsForm();
				} }
			>
				{ willEnable
					? __( 'Show & Reload Page' )
					: __( 'Hide & Reload Page' ) }
			</Button>
		</>
	);
}

export function EnableCustomFieldsOption( { label, areCustomFieldsEnabled } ) {
	const [ isChecked, setIsChecked ] = useState( areCustomFieldsEnabled );

	return (
		<PreferenceBaseOption
			label={ label }
			isChecked={ isChecked }
			onChange={ setIsChecked }
		>
			{ isChecked !== areCustomFieldsEnabled && (
				<CustomFieldsConfirmation willEnable={ isChecked } />
			) }
		</PreferenceBaseOption>
	);
}

export default withSelect( ( select ) => ( {
	areCustomFieldsEnabled:
		!! select( editorStore ).getEditorSettings().enableCustomFields,
} ) )( EnableCustomFieldsOption );
