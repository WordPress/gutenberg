/**
 * WordPress dependencies
 */
import { Button, ButtonGroup } from '@wordpress/components';
import { formatItalic } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';

/**
 * Control to facilitate font style selections.
 *
 * @param  {Object}   props            Component props.
 * @param  {string}   props.value      Currently selected font style.
 * @param  {Array}    props.fontStyles Font styles available for selection.
 * @param  {Function} props.onChange   Handles change in font style selection.
 * @return {WPElement}                 Font style control.
 */
export default function FontStyleControl( {
	value: fontStyle,
	fontStyles,
	onChange,
} ) {
	/**
	 * Determines the what the new font style is as a result of a user
	 * interaction with the control then passes this on to the supplied onChange
	 * handler.
	 *
	 * @param {string} newStyle Slug for selected style.
	 */
	const handleOnChange = ( newStyle ) => {
		// Check if we are toggling a style off.
		const style = fontStyle === newStyle ? undefined : newStyle;

		// Ensure only defined font styles are allowed.
		const presetStyle = fontStyles.find( ( { slug } ) => slug === style );

		// Create string that will be turned into CSS custom property
		const newFontStyle = presetStyle
			? `var:preset|font-style|${ presetStyle.slug }`
			: undefined;

		onChange( newFontStyle );
	};

	// Font style icons to use.
	const icons = {
		italic: formatItalic,
		oblique: undefined, // Need an underline icon designed.
	};

	return (
		<fieldset className="block-editor-font-style-control">
			<legend>{ __( 'Font Style' ) }</legend>
			<ButtonGroup>
				{ fontStyles.map( ( presetStyle ) => {
					return (
						<Button
							key={ presetStyle.slug }
							icon={ icons[ presetStyle.slug ] }
							isSmall
							isPressed={ fontStyle === presetStyle.slug }
							onClick={ () => handleOnChange( presetStyle.slug ) }
						>
							{ ! icons[ presetStyle.slug ] && presetStyle.name }
						</Button>
					);
				} ) }
			</ButtonGroup>
		</fieldset>
	);
}
