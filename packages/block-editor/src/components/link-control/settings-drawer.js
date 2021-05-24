/**
 * External dependencies
 */
import { noop } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { applyFilters } from '@wordpress/hooks';
import { ToggleControl, VisuallyHidden } from '@wordpress/components';

const defaultSettings = [
	{
		id: 'opensInNewTab',
		title: __( 'Open in new tab' ),
	},
];

const LinkControlSettingsDrawer = ( {
	value,
	onChange = noop,
	settings = defaultSettings,
} ) => {
	settings = applyFilters(
		'core.block-editor.link-control.settings',
		settings,
		value
	);

	if ( ! settings || ! Array.isArray( settings ) || ! settings.length ) {
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
			checked={ value ? !! value[ setting.id ] : false }
		/>
	) );

	return (
		<fieldset className="block-editor-link-control__settings">
			<VisuallyHidden as="legend">
				{ __( 'Currently selected link settings' ) }
			</VisuallyHidden>
			{ theSettings }
		</fieldset>
	);
};

export default LinkControlSettingsDrawer;
