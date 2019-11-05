/**
 * External dependencies
 */
import { partial, noop } from 'lodash';

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

	const theSettings = settings.map( ( setting ) => (
		<ToggleControl
			key={ setting.id }
			label={ setting.title }
			onChange={ partial( onSettingChange, setting.id ) }
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
