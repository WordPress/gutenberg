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

const defaultSettings = {
	newTab: false,
};

const LinkControlSettingsDrawer = ( { settings = defaultSettings, onSettingChange = noop } ) => {
	if ( ! settings || settings.length ) {
		return null;
	}

	return (
		<div className="block-editor-link-control__settings">
			<ToggleControl
				label={ __( 'Open in New Tab' ) }
				onChange={ partial( onSettingChange, 'newTab' ) }
				checked={ settings.newTab } />
		</div>
	);
};

export default LinkControlSettingsDrawer;
