/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Button } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
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
				__next40pxDefaultSize
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

export default function EnableCustomFieldsOption( { label } ) {
	const areCustomFieldsEnabled = useSelect( ( select ) => {
		return !! select( editorStore ).getEditorSettings().enableCustomFields;
	}, [] );
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
