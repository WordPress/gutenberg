/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
import { formatStrikethrough, formatUnderline } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';

/**
 * Control to facilitate text decoration selections.
 *
 * @param  {Object}   props                 Component props.
 * @param  {string}   props.value           Currently selected text decoration.
 * @param  {Array}    props.textDecorations Text decorations available for selection.
 * @param  {Function} props.onChange        Handles change in text decoration selection.
 * @return {WPElement}                      Text decoration control.
 */
export default function TextDecorationControl( {
	value: textDecoration,
	textDecorations,
	onChange,
} ) {
	/**
	 * Determines the what the new text decoration is as a result of a user
	 * interaction with the control. Then passes this on to the supplied
	 * onChange handler.
	 *
	 * @param {string} newDecoration Slug for selected decoration.
	 */
	const handleOnChange = ( newDecoration ) => {
		// Check if we are toggling a decoration off.
		const decoration =
			textDecoration === newDecoration ? undefined : newDecoration;

		// Ensure only defined text decorations are allowed.
		const presetDecoration = textDecorations.find(
			( { slug } ) => slug === decoration
		);

		// Create string that will be turned into CSS custom property
		const newTextDecoration = presetDecoration
			? `var:preset|text-decoration|${ presetDecoration.slug }`
			: undefined;

		onChange( newTextDecoration );
	};

	// Text Decoration icons to use.
	const icons = {
		strikethrough: formatStrikethrough,
		underline: formatUnderline,
	};

	return (
		<fieldset className="block-editor-text-decoration-control">
			<legend>{ __( 'Decoration' ) }</legend>
			<div className="block-editor-text-decoration-control__buttons">
				{ textDecorations.map( ( presetDecoration ) => {
					return (
						<Button
							key={ presetDecoration.slug }
							icon={ icons[ presetDecoration.slug ] }
							isSmall
							isPressed={
								textDecoration === presetDecoration.slug
							}
							onClick={ () =>
								handleOnChange( presetDecoration.slug )
							}
						>
							{ ! icons[ presetDecoration.slug ] &&
								presetDecoration.name }
						</Button>
					);
				} ) }
			</div>
		</fieldset>
	);
}
