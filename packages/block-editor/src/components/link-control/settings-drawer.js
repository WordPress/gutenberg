/**
 * External dependencies
 */
import { noop } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	ToggleControl,
} from '@wordpress/components';

const defaultSettings = [
	{
		id: 'newTab',
		title: __( 'Open in New Tab' ),
		checked: false,
	},
];

const LinkControlSettingsDrawer = ( { settings = defaultSettings, onSettingChange = noop } ) => {
	if ( ! settings || ! settings.length ) {
		return null;
	}

	const handleSettingChange = ( setting ) => ( value ) => {
		onSettingChange( setting.id, value, settings );
	};

	const theSettings = settings.map( ( setting ) => (
		<ToggleControl
			key={ setting.id }
			label={ setting.title }
			onChange={ handleSettingChange( setting ) }
			checked={ setting.checked } />
	) );

	return (
		<fieldset className="block-editor-link-control__settings">
			<legend className="screen-reader-text">
				{ __( 'Currently selected link settings' ) }
			</legend>
			{ theSettings }
		</fieldset>
	);
};

export default LinkControlSettingsDrawer;
