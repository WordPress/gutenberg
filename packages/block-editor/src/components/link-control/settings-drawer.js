/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { ToggleControl, VisuallyHidden } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { useLinkControlContext } from './';
const noop = () => {};

const LinkControlSettingsDrawer = () => {
	const {
		value,
		onChange = noop,
		settings,
		showSettingsDrawer,
	} = useLinkControlContext();

	if ( ! showSettingsDrawer || ! settings || ! settings.length ) {
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
		<div className="block-editor-link-control__tools">
			<fieldset className="block-editor-link-control__settings">
				<VisuallyHidden as="legend">
					{ __( 'Currently selected link settings' ) }
				</VisuallyHidden>
				{ theSettings }
			</fieldset>
		</div>
	);
};

export default LinkControlSettingsDrawer;
