/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import {
	formatCapitalize,
	formatLowercase,
	formatUppercase,
} from '@wordpress/icons';

/**
 * Control to facilitate text transform selections.
 *
 * @param  {Object}   props                Component props.
 * @param  {string}   props.value          Currently selected text transform.
 * @param  {Array}    props.textTransforms Text transforms available for selection.
 * @param  {Function} props.onChange       Handles change in text transform selection.
 * @return {WPElement}                     Text transform control.
 */
export default function TextTransformControl( {
	value: textTransform,
	textTransforms,
	onChange,
} ) {
	/**
	 * Determines what the new text transform is as a result of a user
	 * interaction with the control. Then passes this on to the supplied
	 * onChange handler.
	 *
	 * @param {string} newTransform Slug for selected text transform.
	 */
	const handleOnChange = ( newTransform ) => {
		// Check if we are toggling a transform off.
		const transform =
			textTransform === newTransform ? undefined : newTransform;

		// Ensure only defined text transforms are allowed.
		const presetTransform = textTransforms.find(
			( { slug } ) => slug === transform
		);

		// Create string that will be turned into CSS custom property
		const newTextTransform = presetTransform
			? `var:preset|text-transform|${ presetTransform.slug }`
			: undefined;

		onChange( newTextTransform );
	};

	// Text transform icons to use.
	// Icons still to be created/designed.
	const icons = {
		capitalize: formatCapitalize,
		lowercase: formatLowercase,
		uppercase: formatUppercase,
	};

	return (
		<fieldset className="block-editor-text-transform-control">
			<legend>{ __( 'Letter case' ) }</legend>
			<div className="block-editor-text-transform-control__buttons">
				{ textTransforms.map( ( presetTransform ) => {
					return (
						<Button
							key={ presetTransform.slug }
							icon={ icons[ presetTransform.slug ] }
							isSmall
							isPressed={ textTransform === presetTransform.slug }
							onClick={ () =>
								handleOnChange( presetTransform.slug )
							}
						>
							{ ! icons[ presetTransform.slug ] &&
								presetTransform.name }
						</Button>
					);
				} ) }
			</div>
		</fieldset>
	);
}
