/**
 * WordPress dependencies
 */
import { Button, ButtonGroup } from '@wordpress/components';

/**
 * Control to facilitate width selections.
 *
 * @param  {Object}   props                 Component props.
 * @param  {string}   props.value           Currently selected text decoration.
 * @param  {Array}    props.widthOptions    Width options available for selection.
 * @param  {Function} props.onChange        Handles change in width selection.
 * @return {WPElement}                      Width control.
 */
export default function WidthControl( {
	value: selectedWidth,
	widthOptions,
	onChange,
} ) {
	/**
	 * Determines the new width as a result of user interaction with
	 * the control. Then passes this to the supplied onChange handler.
	 *
	 * @param {string} newWidth Slug for selected width
	 */
	const handleChange = ( newWidth ) => {
		// Check if we are toggling the width off
		const width = selectedWidth === newWidth ? undefined : newWidth;

		// Ensure only predefined width options are allowed
		const presetWidth = widthOptions.find( ( { slug } ) => slug === width );

		// Create string that will be turned into custom CSS property
		const customWidthProperty = presetWidth
			? `var:preset|width|${ presetWidth.slug }`
			: undefined;

		// Pass on to the supplied handler.
		onChange( customWidthProperty );
	};

	return (
		<ButtonGroup>
			{ widthOptions.map( ( widthOption ) => {
				return (
					<Button
						key={ widthOption.slug }
						isSmall
						isPrimary={ selectedWidth === widthOption.slug }
						onClick={ () => handleChange( widthOption.slug ) }
					>
						{ widthOption.value }
					</Button>
				);
			} ) }
		</ButtonGroup>
	);
}
