/**
 * External dependencies
 */
import { partial } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	ToggleControl,
} from '@wordpress/components';

const LinkControlSettingsDrawer = ( { settings, onSettingChange } ) => {
	if ( ! settings || settings.length ) {
		return null;
	}

	return (
		<div className="block-editor-link-control__settings">
			<ToggleControl
				label={ __( 'Open in New Tab' ) }
				onChange={ partial( onSettingChange, 'new-tab' ) }
				checked={ settings[ 'new-tab' ] } />
		</div>
	);
};

export default LinkControlSettingsDrawer;
