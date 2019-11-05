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
		value: false,
	},
];

const LinkControlSettingsDrawer = ( { settings = defaultSettings, onSettingChange = noop } ) => {
	if ( ! settings || ! settings.length ) {
		return null;
	}

	return (
		<div className="block-editor-link-control__settings">
			<ToggleControl
				label={ settings[ 0 ].title }
				onChange={ partial( onSettingChange, settings[ 0 ].id ) }
				checked={ settings[ 0 ].value } />
		</div>
	);
};

export default LinkControlSettingsDrawer;
