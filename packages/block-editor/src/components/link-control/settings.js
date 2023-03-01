/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { ToggleControl, VisuallyHidden } from '@wordpress/components';

const noop = () => {};

const LinkControlSettings = ( { value, onChange = noop, settings } ) => {
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
			__nextHasNoMarginBottom
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

export default LinkControlSettings;
