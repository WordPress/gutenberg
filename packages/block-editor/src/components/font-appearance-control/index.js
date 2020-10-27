/**
 * WordPress dependencies
 */
import { CustomSelectControl } from '@wordpress/components';
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Control to display unified font style and weight options.
 *
 * @param  {Object}   props          Component props.
 * @param  {Object}   props.value    Currently selected combination of font style and weight.
 * @param  {Object}   props.options  Object containing weight and style options.
 * @param  {Function} props.onChange Handles selection change.
 * @return {WPElement}               Font appearance control.
 */
export default function FontAppearanceControl( { value, options, onChange } ) {
	const { fontStyle, fontWeight } = value;
	const { fontStyles = [], fontWeights = [] } = options;
	const hasStylesOrWeights = fontStyles.length > 0 || fontWeights.length > 0;

	// Map font styles and weights to select options.
	const selectOptions = useMemo( () => {
		const defaultCombo = { fontStyle: undefined, fontWeight: undefined };
		const combinedOptions = [
			{
				key: 'default',
				name: __( 'Default' ),
				style: defaultCombo,
				presetStyle: defaultCombo,
			},
		];

		fontStyles.forEach( ( { name: styleName, slug: styleSlug } ) => {
			fontWeights.forEach( ( { name: weightName, slug: weightSlug } ) => {
				combinedOptions.push( {
					key: `${ weightSlug }-${ styleSlug }`,
					name:
						styleSlug === 'normal'
							? weightName
							: `${ weightName } ${ styleName }`,
					// style applies font appearance to the individual select option.
					style: { fontStyle: styleSlug, fontWeight: weightSlug },
					// presetStyle are the actual typography styles that should be given to onChange.
					presetStyle: {
						fontStyle: `var:preset|font-style|${ styleSlug }`,
						fontWeight: `var:preset|font-weight|${ weightSlug }`,
					},
				} );
			} );
		} );

		return combinedOptions;
	}, [ options ] );

	const currentSelection = selectOptions.find(
		( option ) =>
			option.presetStyle.fontStyle === fontStyle &&
			option.presetStyle.fontWeight === fontWeight
	);

	return (
		<fieldset className="components-font-appearance-control">
			{ hasStylesOrWeights && (
				<CustomSelectControl
					className="components-font-appearance-control__select"
					label={ __( 'Appearance' ) }
					options={ selectOptions }
					value={ currentSelection }
					onChange={ ( { selectedItem } ) =>
						onChange( selectedItem.presetStyle )
					}
				/>
			) }
		</fieldset>
	);
}
