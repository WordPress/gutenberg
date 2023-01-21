/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Button, ToggleControl, VisuallyHidden } from '@wordpress/components';
import { settings as settingsIcon } from '@wordpress/icons';
import { useState } from '@wordpress/element';

const noop = () => {};

const LinkControlSettingsDrawer = ( { value, onChange = noop, settings } ) => {
	const [ isOpen, setIsOpen ] = useState( false );

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
			checked={ value ? !! value[ setting.id ] : false }
		/>
	) );

	return (
		<>
			<Button
				aria-expanded={ isOpen }
				onClick={ () => setIsOpen( ! isOpen ) }
				icon={ settingsIcon }
				label={ __( 'Toggle link settings' ) }
				aria-controls="link-1"
			/>

			{ isOpen && (
				<fieldset
					hidden={ ! isOpen }
					id={ 'link-1' }
					className="block-editor-link-control__settings"
				>
					<VisuallyHidden as="legend">
						{ __( 'Currently selected link settings' ) }
					</VisuallyHidden>
					{ theSettings }
				</fieldset>
			) }
		</>
	);
};

export default LinkControlSettingsDrawer;
