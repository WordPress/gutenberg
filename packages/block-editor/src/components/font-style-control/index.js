/**
 * WordPress dependencies
 */
import { SelectControl } from '@wordpress/components';
import { useMemo } from '@wordpress/element';
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
	 * @param {string} style Slug for selected style.
	 */
	const handleOnChange = ( style ) => {
		// Ensure only defined font styles are allowed.
		const presetStyle = fontStyles.find( ( { slug } ) => slug === style );

		// Create string that will be turned into CSS custom property
		const newFontStyle = presetStyle
			? `var:preset|font-style|${ presetStyle.slug }`
			: undefined;

		onChange( newFontStyle );
	};

	// Map styles to select options and inject a default for inheriting font style.
	const options = useMemo(
		() => [
			{ label: __( 'Default' ), value: '' },
			...fontStyles.map( ( { name, slug } ) => ( {
				label: name,
				value: slug,
			} ) ),
		],
		[ fontStyles ]
	);

	return (
		<fieldset className="components-font-style-control">
			<div className="components-font-style-control__select">
				{ fontStyles.length > 0 && (
					<SelectControl
						options={ options }
						value={ fontStyle }
						label={ __( 'Font style' ) }
						onChange={ handleOnChange }
					/>
				) }
			</div>
		</fieldset>
	);
}
