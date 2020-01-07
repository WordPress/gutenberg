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
		id: 'opensInNewTab',
		title: __( 'Open in New Tab' ),
	},
];

const LinkControlSettingsDrawer = ( { value, onChange = noop, settings = defaultSettings } ) => {
	if ( ! settings || ! settings.length ) {
		return null;
	}

	const handleSettingChange = ( setting ) => ( newValue ) => {
		onChange( {
			...value,
			[ setting.id ]: newValue,
		} );
	};

	const theSettings = settings.map( ( setting ) => (
		<ToggleControl
			className="block-editor-link-control__setting"
			key={ setting.id }
			label={ setting.title }
			onChange={ handleSettingChange( setting ) }
			checked={ value ? value[ setting.id ] : false } />
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
