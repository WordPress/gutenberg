/**
 * WordPress dependencies
 */
import { CustomSelectControl } from '@wordpress/components';
import { useMemo } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

const FONT_STYLES = [
	{
		name: __( 'Regular' ),
		value: 'normal',
	},
	{
		name: __( 'Italic' ),
		value: 'italic',
	},
];

const FONT_WEIGHTS = [
	{
		name: __( 'Thin' ),
		value: '100',
	},
	{
		name: __( 'Extra Light' ),
		value: '200',
	},
	{
		name: __( 'Light' ),
		value: '300',
	},
	{
		name: __( 'Regular' ),
		value: '400',
	},
	{
		name: __( 'Medium' ),
		value: '500',
	},
	{
		name: __( 'Semi Bold' ),
		value: '600',
	},
	{
		name: __( 'Bold' ),
		value: '700',
	},
	{
		name: __( 'Extra Bold' ),
		value: '800',
	},
	{
		name: __( 'Black' ),
		value: '900',
	},
];

/**
 * Control to display unified font style and weight options.
 *
 * @param  {Object}   props Component props.
 * @return {WPElement}      Font appearance control.
 */
export default function FontAppearanceControl( props ) {
	const {
		onChange,
		hasFontStyles = true,
		hasFontWeights = true,
		value: { fontStyle, fontWeight },
	} = props;
	const hasStylesOrWeights = hasFontStyles || hasFontWeights;
	const defaultOption = {
		key: 'default',
		name: __( 'Default' ),
		style: { fontStyle: undefined, fontWeight: undefined },
	};

	// Combines both font style and weight options into a single dropdown.
	const combineOptions = () => {
		const combinedOptions = [ defaultOption ];

		FONT_STYLES.forEach( ( { name: styleName, value: styleValue } ) => {
			FONT_WEIGHTS.forEach(
				( { name: weightName, value: weightValue } ) => {
					const optionName =
						styleValue === 'normal'
							? weightName
							: sprintf(
									/* translators: 1: Font weight name. 2: Font style name. */
									__( '%1$s %2$s' ),
									weightName,
									styleName
							  );

					combinedOptions.push( {
						key: `${ styleValue }-${ weightValue }`,
						name: optionName,
						style: {
							fontStyle: styleValue,
							fontWeight: weightValue,
						},
					} );
				}
			);
		} );

		return combinedOptions;
	};

	// Generates select options for font styles only.
	const styleOptions = () => {
		const combinedOptions = [ defaultOption ];
		FONT_STYLES.forEach( ( { name, value } ) => {
			combinedOptions.push( {
				key: value,
				name,
				style: { fontStyle: value, fontWeight: undefined },
			} );
		} );
		return combinedOptions;
	};

	// Generates select options for font weights only.
	const weightOptions = () => {
		const combinedOptions = [ defaultOption ];
		FONT_WEIGHTS.forEach( ( { name, value } ) => {
			combinedOptions.push( {
				key: value,
				name,
				style: { fontStyle: undefined, fontWeight: value },
			} );
		} );
		return combinedOptions;
	};

	// Map font styles and weights to select options.
	const selectOptions = useMemo( () => {
		if ( hasFontStyles && hasFontWeights ) {
			return combineOptions();
		}

		return hasFontStyles ? styleOptions() : weightOptions();
	}, [ props.options ] );

	// Find current selection by comparing font style & weight against options.
	const currentSelection = selectOptions.find(
		( option ) =>
			option.style.fontStyle === fontStyle &&
			option.style.fontWeight === fontWeight
	);

	// Adjusts field label in case either styles or weights are disabled.
	const getLabel = () => {
		if ( ! hasFontStyles ) {
			return __( 'Font weight' );
		}

		if ( ! hasFontWeights ) {
			return __( 'Font style' );
		}

		return __( 'Appearance' );
	};

	return (
		<fieldset className="components-font-appearance-control">
			{ hasStylesOrWeights && (
				<CustomSelectControl
					className="components-font-appearance-control__select"
					label={ getLabel() }
					options={ selectOptions }
					value={ currentSelection }
					onChange={ ( { selectedItem } ) =>
						onChange( selectedItem.style )
					}
				/>
			) }
		</fieldset>
	);
}
