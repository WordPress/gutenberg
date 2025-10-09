/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { CheckboxControl, VisuallyHidden } from '@wordpress/components';

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

	const theSettings = settings
		.map( ( setting ) => {
			// If render property is provided
			if ( 'render' in setting ) {
				// If it's a valid function, use it
				if ( typeof setting.render === 'function' ) {
					const renderedContent = setting.render(
						setting,
						value,
						onChange
					);
					return (
						<div
							key={ setting.id }
							className="block-editor-link-control__setting"
						>
							{ renderedContent }
						</div>
					);
				}
				// If render is provided but invalid, return null
				return null;
			}

			// If render property is not provided, use CheckboxControl
			return (
				<CheckboxControl
					__nextHasNoMarginBottom
					className="block-editor-link-control__setting"
					key={ setting.id }
					label={ setting.title }
					onChange={ handleSettingChange( setting ) }
					checked={ value ? !! value[ setting.id ] : false }
					help={ setting?.help }
				/>
			);
		} )
		.filter( Boolean ); // Remove null entries

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
